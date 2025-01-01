import { useContext, useEffect, useRef } from 'react';
import { PlayerContext } from '../context/PlayerContext';

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
    console.log('navigator.userAgent', navigator.userAgent, isSafariWebkit);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d')!;

        // Set canvas size
        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Try to get audio data from either the main source or create a fallback
        let analyser: AnalyserNode | null = null;
        if (audioCtx && source && audioCtx.state === 'running' && source.context === audioCtx && !isSafariWebkit) {
            // Main audio context path
            analyser = audioCtx.createAnalyser();
            source.connect(analyser);
            console.log('Using main AudioContext');
        } else if (playerContext?.status === 'playing') {
            // Create a new audio context for visualization only
            try {
                fallbackContextRef.current = new AudioContext();
                analyser = fallbackContextRef.current.createAnalyser();
                console.log('Using fallback visualization');
            } catch (error) {
                console.error('Failed to create fallback visualization:', error);
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
                        
                        // Base frequency response curve (higher in bass, lower in treble)
                        const freqResponse = Math.pow(1 - (i / bufferLength), 0.5);
                        
                        // Add some natural movement
                        const time = Date.now() / 1000;
                        const oscillation = Math.sin(time * 2 + i * 0.1) * 0.2;
                        
                        // Random variations
                        const noise = (Math.random() - 0.5) * 0.1;
                        
                        // Combine and smooth with previous value
                        let newValue = prevValue * 0.9 + // Smoothing
                                     (freqResponse * 0.8 + // Base response
                                      oscillation + // Natural movement
                                      noise) * 0.1; // Small variations
                        
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
            window.removeEventListener('resize', resize);
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
