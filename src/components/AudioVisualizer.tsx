import { useContext, useEffect, useRef } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { logToServer, LogLevels } from '../lib/api';

export default function AudioVisualizer({ source, audioCtx, className }: {
    source: AudioNode | undefined,
    audioCtx: AudioContext | undefined,
    className?: string
}) {
    const playerContext = useContext(PlayerContext);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>();
    const fallbackContextRef = useRef<AudioContext | null>(null);
    const previousDataRef = useRef<Float32Array | null>(null);
    
    // Check if the browser is Safari WebKit and return a boolean
    const isSafariWebkit = Boolean(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
    //const isSafariWebkit = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && /Apple/i.test(navigator.vendor);
    logToServer('navigator.userAgent: ' + navigator.userAgent + 'isSafariWebkit: ' + isSafariWebkit, LogLevels.TRACE, 'AudioVisualizer.tsx');

    useEffect(() => {
        if (!audioCtx || !source || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d')!;

        let resizeTimeout: number;
        let lastWidth = 0;
        let lastHeight = 0;

        const updateCanvasSize = (width: number, height: number) => {
            // Only update if dimensions changed significantly (more than 1px)
            if (Math.abs(width - lastWidth) > 1 || Math.abs(height - lastHeight) > 1) {
                canvas.width = width;
                canvas.height = Math.min(height, 120) || 40;
                lastWidth = width;
                lastHeight = height;
            }
        };

        // Create ResizeObserver for reliable size detection
        const resizeObserver = new ResizeObserver((entries) => {
            // Clear any pending timeout
            if (resizeTimeout) {
                window.clearTimeout(resizeTimeout);
            }

            // Debounce the resize callback
            resizeTimeout = window.setTimeout(() => {
                for (const entry of entries) {
                    const width = entry.contentRect.width;
                    const height = entry.contentRect.height;
                    if (width > 0 && height > 0) {
                        updateCanvasSize(width, height);
                    }
                }
            }, 100); // 100ms debounce
        });

        // Only observe the parent element
        const parent = canvas.parentElement;
        if (parent) {
            resizeObserver.observe(parent);
            // Initial size update
            updateCanvasSize(parent.offsetWidth, parent.offsetHeight);
        }

        // Create IntersectionObserver to detect visibility
        const intersectionObserver = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting && entry.target.parentElement) {
                    // Force size update when becoming visible
                    const parent = entry.target.parentElement;
                    updateCanvasSize(parent.offsetWidth, parent.offsetHeight);
                }
            }
        });

        intersectionObserver.observe(canvas);

        // Try to get audio data from either the main source or create a fallback
        let analyser: AnalyserNode | null = null;
        if (audioCtx && source && audioCtx.state === 'running' && source.context === audioCtx && !isSafariWebkit) {
            // Main audio context path
            analyser = audioCtx.createAnalyser();
            source.connect(analyser);
            logToServer('Using main AudioContext', LogLevels.TRACE, 'AudioVisualizer.tsx');
        } else if (playerContext?.status === 'playing') {
            // Create a new audio context for visualization only
            try {
                fallbackContextRef.current = new AudioContext();
                analyser = fallbackContextRef.current.createAnalyser();
                logToServer('Using fallback visualization', LogLevels.DEBUG, 'AudioVisualizer.tsx');
            } catch (error) {
                logToServer('Failed to create fallback visualization:', LogLevels.ERROR, 'AudioVisualizer.tsx', error);
            }
        }

        if (analyser) {
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            analyserRef.current = analyser;

            // Prepare data array
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            // Initialize previous data if needed
            if (!previousDataRef.current) {
                previousDataRef.current = new Float32Array(bufferLength);
            }
            
            // Animation function
            const draw = () => {
                if (!analyserRef.current || !ctx) return;

                animationFrameRef.current = requestAnimationFrame(draw);

                // Clear canvas properly
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Calculate bar width and spacing - same for both modes
                const barWidth = (canvas.width / bufferLength) * 2.5;
                const barSpacing = 2;
                let x = 0;

                if (!isSafariWebkit) {
                    analyserRef.current.getByteFrequencyData(dataArray);
                } else {
                    // For Safari, create realistic-looking frequency data
                    for (let i = 0; i < bufferLength; i++) {
                        const prevValue = previousDataRef.current![i];
                        
                        // Dynamic frequency response (stronger in bass, with resonant peaks)
                        const freqResponse = Math.pow(1 - (i / bufferLength), 1.5) * 
                            (1 + Math.exp(-((i - bufferLength * 0.2) ** 2) / 100)) * // Bass resonance
                            (1 + Math.exp(-((i - bufferLength * 0.6) ** 2) / 200)); // Mid resonance
                        
                        // Multiple oscillators at different frequencies and phases
                        const time = Date.now() / 1000;
                        const oscillation = 
                            Math.sin(time * 1.5 + i * 0.2) * 0.15 + // Slow wave
                            Math.sin(time * 3.7 + i * 0.1) * 0.1 + // Medium wave
                            Math.sin(time * 7.3 + i * 0.15) * 0.05; // Fast wave
                        
                        // Enhanced random variations
                        const noise = (Math.random() - 0.5) * 0.25;
                        
                        // Sudden peaks simulation (bass hits)
                        const bassHit = Math.random() < 0.03 && i < bufferLength * 0.3 ? 
                            Math.random() * 0.5 : 0;
                        
                        // Combine with less smoothing for more dynamic movement
                        let newValue = prevValue * 0.7 + // Reduced smoothing
                                     (freqResponse * 0.6 + // Base response
                                      oscillation + // Complex movement
                                      noise + // Increased randomness
                                      bassHit) * 0.3; // More influence from current frame
                        
                        // Ensure value stays in range
                        newValue = Math.max(0.1, Math.min(1, newValue));
                        previousDataRef.current![i] = newValue;
                        
                        // Convert to byte range (0-255)
                        dataArray[i] = Math.floor(newValue * 255);
                    }
                }

                // Draw frequency bars
                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (dataArray[i] / 255) * canvas.height;

                    // Create gradient with more vibrant colors
                    const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
                    gradient.addColorStop(0, '#00ff00');  // Bright green at top
                    gradient.addColorStop(0.5, '#00cc00'); // Mid green
                    gradient.addColorStop(1, '#004400');  // Darker green at bottom

                    ctx.fillStyle = gradient;
                    ctx.globalAlpha = 1.0;
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                    x += barWidth + barSpacing;
                }
            };

            draw();
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (analyserRef.current && source && !isSafariWebkit) {
                source.disconnect(analyserRef.current);
            }
            if (fallbackContextRef.current) {
                fallbackContextRef.current.close();
            }
            if (resizeTimeout) {
                window.clearTimeout(resizeTimeout);
            }
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
        };
    }, [source, audioCtx, playerContext?.status, isSafariWebkit]);

    return (
        <div className={className} style={{ width: '100%', height: '100%' }}>
            <canvas 
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block'
                }}
            />
        </div>
    );
}
