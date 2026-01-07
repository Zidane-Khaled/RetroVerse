import { useEffect, useRef, useState } from 'react';
import { JSNES } from 'jsnes';

/**
 * useJsnesEmulator - React hook for jsnes with multiplayer support
 */
export function useJsnesEmulator({ multiplayer }) {
  const canvasRef = useRef(null);
  const nesRef = useRef(null);
  const rafRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [frameInfo, setFrameInfo] = useState({ frame: 0, fps: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize jsnes
    const nes = new JSNES({
      onFrame: (frameBuffer) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(256, 240);

        // Convert JSNES frame buffer to canvas
        for (let i = 0; i < frameBuffer.length; i++) {
          imageData.data[i] = frameBuffer[i];
        }
        ctx.putImageData(imageData, 0, 0);
      },
      onAudioSample: null // Audio not needed for this demo
    });

    nesRef.current = nes;

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  /**
   * Compute hash of emulator state for desync detection
   */
  const computeStateHash = () => {
    if (!nesRef.current) return null;

    try {
      const nes = nesRef.current;
      // Simple hash based on CPU state (in production, could hash full RAM)
      const stateStr = JSON.stringify({
        pc: nes.cpu?.pc ?? 0,
        a: nes.cpu?.a ?? 0,
        x: nes.cpu?.x ?? 0,
        y: nes.cpu?.y ?? 0,
        sp: nes.cpu?.sp ?? 0,
        status: nes.cpu?.status ?? 0
      });

      // Simple hash calculation
      let hash = 0;
      for (let i = 0; i < stateStr.length; i++) {
        const char = stateStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16).padStart(8, '0');
    } catch (err) {
      console.warn('Could not compute state hash:', err);
      return 'unknown';
    }
  };

  /**
   * Main emulation loop with input synchronization
   */
  const emulationLoop = () => {
    const nes = nesRef.current;
    if (!nes || !multiplayer || multiplayer.isPaused) {
      rafRef.current = requestAnimationFrame(emulationLoop);
      return;
    }

    // Check if we have inputs from both sides
    if (!multiplayer.canAdvanceFrame()) {
      // Still waiting for remote input, reschedule
      rafRef.current = requestAnimationFrame(emulationLoop);
      return;
    }

    // Get inputs for current frame
    const { local, remote } = multiplayer.getInputForFrame(multiplayer.frameCounter);

    // Apply local player input
    applyInput(nes, local, 1);

    // Apply remote player input
    applyInput(nes, remote, 2);

    // Tick emulator
    nes.frame();

    // Send checkpoint periodically
    const hash = computeStateHash();
    multiplayer.setLocalHash(hash);
    multiplayer.sendCheckpoint(hash);

    // Update frame counter and UI
    multiplayer.advanceFrame();
    setFrameInfo({
      frame: multiplayer.frameCounter,
      fps: 60 // 60 FPS nominal
    });

    rafRef.current = requestAnimationFrame(emulationLoop);
  };

  const applyInput = (nes, input, player) => {
    // JSNES button codes:
    // 0x01 = A, 0x02 = B, 0x04 = SELECT, 0x08 = START
    // 0x10 = UP, 0x20 = DOWN, 0x40 = LEFT, 0x80 = RIGHT

    const buttonMap = {
      a: 0x01,
      b: 0x02,
      select: 0x04,
      start: 0x08,
      up: 0x10,
      down: 0x20,
      left: 0x40,
      right: 0x80
    };

    // Clear previous inputs
    for (let code = 1; code <= 128; code *= 2) {
      nes.buttonUp(player, code);
    }

    // Apply current inputs
    for (const [key, code] of Object.entries(buttonMap)) {
      if (input[key]) {
        nes.buttonDown(player, code);
      }
    }
  };

  const loadROM = async (romData) => {
    if (!nesRef.current) return;
    try {
      nesRef.current.loadROM(romData);
      console.log('✓ ROM loaded');
      setIsRunning(false); // Will be set to true when game starts
    } catch (err) {
      console.error('Failed to load ROM:', err);
    }
  };

  const pause = () => {
    setIsRunning(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  };

  const resume = () => {
    setIsRunning(true);
    emulationLoop();
  };

  return {
    canvasRef,
    loadROM,
    pause,
    resume,
    isRunning,
    frameInfo,
    nes: nesRef.current
  };
}

