import { useContext, useEffect, useRef } from 'react';
import { PlayerContext } from '../context/PlayerContext';

// Extend AnalyserNode type to include our custom property
interface ExtendedAnalyserNode extends AnalyserNode {
    _lastData?: Uint8Array;
}

export default function AudioVisualizer({ source, audioCtx, className }: {
    source: AudioNode | undefined,
    audioCtx: AudioContext | undefined,
    className?: string
}) {
    const playerContext = useContext(PlayerContext);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserRef = useRef<ExtendedAnalyserNode | null>(null);
    const animationFrameRef = useRef<number>();
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    
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

        // Initialize analyzer function
        const initializeAnalyzer = (analyser: AnalyserNode) => {
            // Configure analyzer for better sensitivity
            analyser.fftSize = 2048; // Larger FFT size for more detail
            analyser.minDecibels = -90; // Lower minimum to catch quieter sounds
            analyser.maxDecibels = -10; // Upper limit
            analyser.smoothingTimeConstant = 0.4; // Faster response
            analyserRef.current = analyser;

            // Prepare data array
            const bufferLength = analyser.frequencyBinCount;
            console.log('bufferLength', bufferLength);
            const dataArray = new Uint8Array(bufferLength);
            
            // Animation function
            function draw() {
                if (!analyserRef.current || !ctx) return;

                animationFrameRef.current = requestAnimationFrame(draw);

                // Clear canvas properly
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Calculate bar width and spacing - same for both modes
                const barWidth = (canvas.width / bufferLength) * 2.5;
                const barSpacing = 2;
                let x = 0;

                // Get visualization data
                if (isSafariWebkit && analyserRef.current?._lastData) {
                    // Use worklet data directly for Safari
                    dataArray.set(analyserRef.current._lastData);
                } else {
                    // Use analyzer for other browsers
                    analyserRef.current?.getByteTimeDomainData(dataArray);
                }
                
                // Debug: log some values periodically
                if (Date.now() % 1000 < 16) { // Log roughly every second
                    // Calculate RMS value to detect audio activity
                    let rms = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        // Convert to -1 to 1 range
                        const amplitude = (dataArray[i] - 128) / 128;
                        rms += amplitude * amplitude;
                    }
                    rms = Math.sqrt(rms / dataArray.length);
                    
                    if (rms < 0.01) { // Very low activity threshold
                        console.log('Low audio activity detected:', {
                            rms: rms,
                            sourceType: source?.constructor.name,
                            contextState: audioCtx?.state,
                            playerStatus: playerContext?.status,
                            sourceNode: source instanceof MediaElementAudioSourceNode ? {
                                mediaElement: (source as MediaElementAudioSourceNode).mediaElement.currentTime,
                                paused: (source as MediaElementAudioSourceNode).mediaElement.paused,
                                readyState: (source as MediaElementAudioSourceNode).mediaElement.readyState
                            } : 'unknown'
                        });
                    }
                }

                // Draw waveform bars
                for (let i = 0; i < bufferLength; i++) {
                    // Convert byte data to amplitude
                    const amplitude = Math.abs((dataArray[i] - 128) / 128);
                    const barHeight = amplitude * canvas.height;

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
        };

        // Try to set up the analyzer with the provided source
        const setupAnalyzer = async (): Promise<AnalyserNode | null> => {
            if (!audioCtx || !source) {
                console.log('Cannot set up analyzer, missing context or source:', {
                    hasContext: !!audioCtx,
                    hasSource: !!source,
                    sourceType: source?.constructor.name,
                    isSafari: isSafariWebkit,
                    playerStatus: playerContext?.status
                });
                return null;
            }

            // Ensure context is running
            if (audioCtx.state === 'suspended') {
                console.log('Resuming AudioContext for analyzer');
                try {
                    await audioCtx.resume();
                    console.log('AudioContext resumed:', audioCtx.state);
                } catch (error) {
                    console.error('Failed to resume AudioContext:', error);
                    return null;
                }
            }

            // Create and configure nodes
            const analyser = audioCtx.createAnalyser() as ExtendedAnalyserNode;
            analyser.fftSize = 2048;
            analyser.minDecibels = -90;
            analyser.maxDecibels = -10;
            analyser.smoothingTimeConstant = 0.4;

            // Create a gain node for proper signal routing
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = 1.0;

            // Connect source to gain node first
            source.connect(gainNode);

            if (isSafariWebkit) {
                console.log('Using AudioWorklet for Safari');
                try {
                    // Load and register the worklet
                    await audioCtx.audioWorklet.addModule('/audioWorklet.js');
                    const workletNode = new AudioWorkletNode(audioCtx, 'safari-audio-processor');
                    workletNodeRef.current = workletNode;

                    // Handle audio data from worklet
                    workletNode.port.onmessage = (event) => {
                        if (event.data.samples && analyserRef.current) {
                            // Data is already in byte format (0-255)
                            const dataArray = event.data.samples;
                            
                            // Debug: log data characteristics periodically
                            if (Date.now() % 1000 < 16) {
                                const avg = dataArray.reduce((a: number, b: number) => a + b, 0) / dataArray.length;
                                const min = Math.min(...dataArray);
                                const max = Math.max(...dataArray);
                                console.log('Worklet data received:', {
                                    size: dataArray.length,
                                    average: avg,
                                    min,
                                    max,
                                    hasActivity: Math.abs(avg - 128) > 1 || (max - min) > 2
                                });
                            }

                            // Create a new array of the correct size and copy data safely
                            const fullArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                            fullArray.fill(128); // Fill with center value
                            // Only copy what fits, using Math.min to prevent out of bounds
                            const copyLength = Math.min(dataArray.length, analyserRef.current.frequencyBinCount);
                            fullArray.set(new Uint8Array(dataArray.buffer, 0, copyLength));
                            analyserRef.current._lastData = fullArray;
                        }
                    };

                    // Connect gain node to both worklet and destination
                    gainNode.connect(workletNode);
                    gainNode.connect(analyser);
                    gainNode.connect(audioCtx.destination);
                    
                    console.log('Audio routing setup:', {
                        sourceConnected: true,
                        workletConnected: true,
                        contextState: audioCtx.state
                    });
                    
                    console.log('AudioWorklet initialized and connected');
                } catch (error) {
                    console.error('Failed to initialize AudioWorklet:', error);
                    // Fallback: direct connection to destination
                    source.connect(audioCtx.destination);
                    console.log('Fallback audio routing setup');
                }
            } else {
                // Non-Safari browsers: connect gain node to analyzer and destination
                gainNode.connect(analyser);
                gainNode.connect(audioCtx.destination);
            }

            // Log connection attempt
            console.log('Analyzer connected to source:', {
                sourceType: source.constructor.name,
                contextState: audioCtx.state,
                analyzerState: {
                    fftSize: analyser.fftSize,
                    frequencyBinCount: analyser.frequencyBinCount,
                    minDecibels: analyser.minDecibels,
                    maxDecibels: analyser.maxDecibels
                }
            });

            return analyser;
        };

        // Set up analyzer when we have a valid source
        if (playerContext?.status === 'playing') {
            setupAnalyzer().then(analyser => {
                if (analyser) {
                    initializeAnalyzer(analyser);
                }
            });
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            // Cleanup in reverse order of connection
            if (workletNodeRef.current) {
                try {
                    workletNodeRef.current.port.onmessage = null;
                    workletNodeRef.current.disconnect();
                } catch (error) {
                    console.log('Error disconnecting worklet:', error);
                }
                workletNodeRef.current = null;
            }
            if (analyserRef.current) {
                try {
                    analyserRef.current.disconnect();
                } catch (error) {
                    console.log('Error disconnecting analyzer:', error);
                }
                analyserRef.current = null;
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
