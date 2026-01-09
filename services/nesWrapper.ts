import { NES } from 'jsnes';
import { JSNESInstance } from '../types';

// Audio Context setup
const AUDIO_BUFFERING = 512;
const SAMPLE_COUNT = 4 * 1024;

export class NESWrapper {
  nes: JSNESInstance;
  audioCtx: AudioContext | null = null;
  scriptProcessor: ScriptProcessorNode | null = null;
  
  // Video backing
  frameBuffer: Uint32Array;
  canvasCtx: CanvasRenderingContext2D | null = null;
  imageData: ImageData | null = null;

  // Audio backing
  audioSamples: Float32Array;
  audioWriteIndex: number = 0;
  audioReadIndex: number = 0;

  onFrameCallback: (() => void) | null = null;

  constructor(onFrameRender: () => void) {
    this.onFrameCallback = onFrameRender;
    
    // Initialize audio ring buffer
    this.audioSamples = new Float32Array(SAMPLE_COUNT);
    
    // Initialize NES
    this.nes = new NES({
      onFrame: this.onFrame.bind(this),
      onAudioSample: this.onAudioSample.bind(this),
      sampleRate: 44100, // Default, will be updated on audio init
    });

    // 256x240 pixels, 32-bit color
    this.frameBuffer = new Uint32Array(256 * 240);
  }

  initAudio() {
    if (this.audioCtx) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.audioCtx = new AudioContextClass();
    if (this.audioCtx) {
        this.nes.opts.sampleRate = this.audioCtx.sampleRate;
        
        // Use ScriptProcessor for simplicity with jsnes (AudioWorklet is better but complex for single-file output requirements)
        this.scriptProcessor = this.audioCtx.createScriptProcessor(AUDIO_BUFFERING, 0, 2);
        this.scriptProcessor.onaudioprocess = this.onAudioProcess.bind(this);
        this.scriptProcessor.connect(this.audioCtx.destination);
    }
  }

  resumeAudio() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  loadROM(binaryString: string) {
    this.nes.loadROM(binaryString);
  }

  start() {
    this.resumeAudio();
    // Frame loop is handled externally by requestAnimationFrame calling frame()
  }

  frame() {
    this.nes.frame();
  }

  reset() {
    this.nes.reset();
  }

  // --- Internal Callbacks ---

  onFrame(frameBuffer: number[]) {
    // JSNES passes an array of 32-bit integers. We copy this to our buffer.
    // However, jsnes internals might write directly if configured, but default writes to passed buffer?
    // Actually, JSNES `onFrame` receives the internal framebuffer.
    // We need to copy it to the canvas.
    
    if (!this.canvasCtx || !this.imageData) return;

    const buf = new Uint32Array(frameBuffer); // View it as 32-bit
    // Copy data to ImageData (which is Uint8ClampedArray)
    // We use a Uint32 view on the ImageData buffer for speed
    const data = new Uint32Array(this.imageData.data.buffer);
    
    for (let i = 0; i < 256 * 240; i++) {
        // JSNES default color output is 0xFFRRGGBB (little endian? depends on implementation)
        // Usually it's fine just to copy.
        // We set alpha to 255 (0xFF)
        data[i] = 0xFF000000 | buf[i];
    }
    
    this.canvasCtx.putImageData(this.imageData, 0, 0);
    
    if (this.onFrameCallback) {
        this.onFrameCallback();
    }
  }

  onAudioSample(left: number, right: number) {
    // Simple ring buffer write
    this.audioSamples[this.audioWriteIndex] = left;
    this.audioSamples[this.audioWriteIndex + 1] = right;
    this.audioWriteIndex = (this.audioWriteIndex + 2) % SAMPLE_COUNT;
  }

  onAudioProcess(e: AudioProcessingEvent) {
    const left = e.outputBuffer.getChannelData(0);
    const right = e.outputBuffer.getChannelData(1);
    const size = left.length;

    // We simple read from ring buffer
    // Note: This is a naive implementation. A proper one handles drift.
    for (let i = 0; i < size; i++) {
        left[i] = this.audioSamples[this.audioReadIndex];
        right[i] = this.audioSamples[this.audioReadIndex + 1];
        this.audioReadIndex = (this.audioReadIndex + 2) % SAMPLE_COUNT;
    }
  }

  // --- Controls ---
  
  buttonDown(controller: number, button: number) {
    this.nes.buttonDown(controller, button);
  }

  buttonUp(controller: number, button: number) {
    this.nes.buttonUp(controller, button);
  }

  setCanvas(canvas: HTMLCanvasElement) {
    this.canvasCtx = canvas.getContext('2d');
    this.imageData = this.canvasCtx?.createImageData(256, 240) || null;
  }
}

// Button mapping for JSNES
export const Controller = {
  BUTTON_A: 0,
  BUTTON_B: 1,
  BUTTON_SELECT: 2,
  BUTTON_START: 3,
  BUTTON_UP: 4,
  BUTTON_DOWN: 5,
  BUTTON_LEFT: 6,
  BUTTON_RIGHT: 7,
};
