import { useEffect, useRef } from 'react';

export default function SpectrumAnalyzer({ source, audioCtx, className }: any) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const analyser = useRef<AnalyserNode | undefined>();
  const highShelffFilter = useRef<BiquadFilterNode | undefined>();
  const floatDataArray = useRef<Float32Array>(new Float32Array());
  const barsCount = useRef(0);
  const barWidth = useRef(0);

  useEffect(() => {
    if (!audioCtx || !source) {
      return;
    }

    analyser.current = audioCtx.createAnalyser();
    highShelffFilter.current = audioCtx.createBiquadFilter();

    highShelffFilter.current!.type = 'lowshelf';
    highShelffFilter.current!.frequency.value = 1200;
    highShelffFilter.current!.gain.value = -18;

    source.connect(highShelffFilter.current);
    highShelffFilter.current!.connect(analyser.current!);

    analyser.current!.smoothingTimeConstant = 0.82;
    analyser.current!.fftSize = 128;

    barsCount.current = analyser.current!.frequencyBinCount / 3.2;
    floatDataArray.current = new Float32Array(analyser.current!.frequencyBinCount);
  }, [audioCtx, source]);

  useEffect(() => {
    canvasCtxRef.current = canvasRef.current!.getContext('2d')!;
    canvasCtxRef.current.globalCompositeOperation = 'screen';
    const fpsInterval = 1000 / 60;
    let then = Date.now();
    let elapsed;
    let now;
    let barHeight = 0;
    let x = 0;

    const WIDTH = canvasRef.current!.width;
    const HEIGHT = canvasRef.current!.height;
    const exp = 1.2;

    const barsBucket: number[][] = [];

    draw();

    function draw() {
      requestAnimationFrame(draw);

      now = Date.now();
      elapsed = now - then;
      then = now - (elapsed % fpsInterval);

      if (elapsed >= fpsInterval) {
        canvasCtxRef.current!.clearRect(0, 0, WIDTH + 10, HEIGHT);
      }

      if (!analyser.current) {
        return;
      }

      analyser.current.getFloatFrequencyData(floatDataArray.current);

      x = 0;
      barWidth.current = Math.round((WIDTH - (barsCount.current - 1) * 3) / barsCount.current);
      for (let i = 0; i < barsCount.current; i++) {
        barsBucket[i] ||= [];
        barsBucket[i].push(floatDataArray.current[i]);

        if (elapsed < fpsInterval) {
          return;
        }

        barHeight =
          HEIGHT * 2 - Math.abs(barsBucket[i].reduce((sum, num) => sum + num, 0) / barsBucket[i].length) ** exp;
        barsBucket[i].length = 0;

        if (barHeight < 0) barHeight = 0;
        if (barHeight > HEIGHT) barHeight = HEIGHT;

        canvasCtxRef.current!.fillStyle = '#ADC5FF';
        canvasCtxRef.current!.shadowColor = '#EAF7FF';
        canvasCtxRef.current!.shadowBlur = 15;
        canvasCtxRef.current!.fillRect(x, HEIGHT - barHeight, barWidth.current, barHeight);

        x += barWidth.current + (WIDTH - barsCount.current * barWidth.current) / (barsCount.current - 1);
      }
    }
  }, []);

  return <canvas ref={canvasRef} width="257" height="75" className={`${className}`}></canvas>;
}
