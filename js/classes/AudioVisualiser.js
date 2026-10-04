export default class AudioVisualiser {
  constructor(canvas, audioElement) {
    this.canvas = canvas;
    this.canvasCtx = canvas.getContext("2d");
    this.audioElement = audioElement;
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.animationFrameId = null;
    this.currentGradient = null;
  }

  init() {
    if (this.audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;

      this.source = this.audioCtx.createMediaElementSource(this.audioElement);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      this.start();
    } catch (e) {
      console.log("Web Audio API error:", e);
    }
  }

  resumeContext() {
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  calculateLayout() {
    const barWidth = 3;
    const gap = 3;
    const totalBars = Math.floor(this.canvas.width / (barWidth + gap));
    const startX = (this.canvas.width - totalBars * (barWidth + gap)) / 2;
    return { totalBars, barWidth, gap, startX };
  }

  createBarGradient() {
    const gradient = this.canvasCtx.createLinearGradient(
      0,
      this.canvas.height,
      0,
      0,
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
    gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.7)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0.95)");
    return gradient;
  }

  calculateTargetHeight(i, totalBars, bufferLength, dataArray) {
    const percent = i / totalBars;
    const logIndex = Math.floor(Math.pow(percent, 2.0) * (bufferLength * 0.75));
    const rawValue = dataArray[logIndex] || 0;
    const barNoise = Math.sin(Date.now() * 0.004 + i * 0.7) * 2.5;
    return Math.max(
      4,
      ((rawValue + barNoise) / 255) * (this.canvas.height - 12),
    );
  }

  updateSpringPhysics(targetHeight, currentHeight, velocities, i) {
    const stiffness = 0.18;
    const damping = 0.72;
    const force = (targetHeight - currentHeight) * stiffness;
    velocities[i] = velocities[i] * damping + force;
    return Math.max(4, currentHeight + velocities[i]);
  }

  updatePeakHeight(height, peak) {
    return height > peak ? height : Math.max(height, peak - 1.1);
  }

  drawBar({ x, barWidth, height, peakHeight }) {
    this.canvasCtx.fillStyle = this.currentGradient;
    this.canvasCtx.beginPath();
    this.canvasCtx.roundRect(
      x,
      this.canvas.height - height,
      barWidth,
      height,
      [4, 4, 0, 0],
    );
    this.canvasCtx.fill();

    this.canvasCtx.fillStyle = "rgba(255, 255, 255, 0.9)";
    this.canvasCtx.fillRect(
      x,
      this.canvas.height - peakHeight - 3,
      barWidth,
      2,
    );
  }

  start() {
    if (!this.analyser) return;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let smoothedHeights = [];
    let peakHeights = [];
    let velocities = [];

    const renderFrame = () => {
      this.animationFrameId = requestAnimationFrame(renderFrame);
      this.analyser.getByteFrequencyData(dataArray);
      this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const { totalBars, barWidth, gap, startX } = this.calculateLayout();

      if (smoothedHeights.length !== totalBars) {
        smoothedHeights = new Array(totalBars).fill(4);
        peakHeights = new Array(totalBars).fill(4);
        velocities = new Array(totalBars).fill(0);
      }

      this.currentGradient = this.createBarGradient();
      let x = startX;

      for (let i = 0; i < totalBars; i++) {
        const targetHeight = this.calculateTargetHeight(
          i,
          totalBars,
          bufferLength,
          dataArray,
        );

        smoothedHeights[i] = this.updateSpringPhysics(
          targetHeight,
          smoothedHeights[i],
          velocities,
          i,
        );
        peakHeights[i] = this.updatePeakHeight(
          smoothedHeights[i],
          peakHeights[i],
        );

        this.drawBar({
          x,
          barWidth,
          height: smoothedHeights[i],
          peakHeight: peakHeights[i],
        });

        x += barWidth + gap;
      }
    };

    renderFrame();
  }
}
