import { useEffect, useRef } from 'react';

export default function SpectrumAnalyzer({ source, audioCtx, className }: any) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!audioCtx || !source || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current! as HTMLCanvasElement;
    const canvasCtx = canvas.getContext('2d')!;
    canvasCtx.globalCompositeOperation = 'screen';

    let analyser = audioCtx.createAnalyser();
    let gainNode = audioCtx.createGain();
    let lowShelffFilter = audioCtx.createBiquadFilter();
    let highShelffFilter = audioCtx.createBiquadFilter();

    lowShelffFilter.type = 'lowshelf';
    lowShelffFilter.frequency.value = 1000;
    lowShelffFilter.gain.value = -20;

    highShelffFilter.type = 'highshelf';
    highShelffFilter.frequency.value = 8000;
    highShelffFilter.gain.value = 5;

    gainNode.gain.value = 35;

    source.connect(lowShelffFilter);
    lowShelffFilter.connect(highShelffFilter);
    highShelffFilter.connect(gainNode);
    gainNode.connect(analyser);

    analyser.smoothingTimeConstant = 0.86;
    analyser.fftSize = 128;

    const barsCount = analyser.frequencyBinCount / 3.2;
    const floatDataArray = new Float32Array(analyser.frequencyBinCount);

    const WIDTH = canvas.width - 10;
    const HEIGHT = canvas.height - 10;
    const exp = 1.2;
    const barWidth = Math.round((WIDTH - (barsCount - 1) * 3) / barsCount);

    const fpsInterval = 1000 / 60;
    let then = Date.now();
    let elapsed;
    let now;
    let barHeight = 0;
    let x = 5;
    draw();

    function draw() {
      requestAnimationFrame(draw);

      now = Date.now();
      elapsed = now - then;
      if (elapsed < fpsInterval) {
        return;
      }
      then = now - (elapsed % fpsInterval);

      analyser.getFloatFrequencyData(floatDataArray);

      canvasCtx.clearRect(0, 0, WIDTH + 10, HEIGHT + 10);

      x = 5;
      for (let i = 0; i < barsCount; i++) {
        barHeight = HEIGHT - Math.abs(floatDataArray[i]) ** exp;

        if (barHeight < 0) barHeight = 0;
        if (barHeight > HEIGHT) barHeight = HEIGHT;

        // canvasCtx.fillStyle = '#EAF7FF';
        // canvasCtx.fillStyle = '#111';
        // canvasCtx.shadowBlur = 0;
        // canvasCtx.fillRect(x, 10, barWidth, HEIGHT + 10);
        canvasCtx.fillStyle = '#ADC5FF';
        // canvasCtx.fillStyle = 'rgb(48, 110, 232)';
        canvasCtx.shadowColor = '#EAF7FF';

        canvasCtx.shadowBlur = 25;
        canvasCtx.fillRect(x, HEIGHT - barHeight + 10, barWidth, barHeight);

        x += barWidth + (WIDTH - barsCount * barWidth) / (barsCount - 1);
      }
    }
  }, [audioCtx, source]);

  return <canvas ref={canvasRef} width="267" height="75" className={`${className}`}></canvas>;
}
