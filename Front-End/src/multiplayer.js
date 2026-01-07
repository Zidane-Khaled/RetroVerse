/**
 * InputBuffer - Frame-indexed input storage with prediction fallback
 */
export class InputBuffer {
  constructor() {
    this.buffer = new Map();
    this.lastKnownInput = {
      a: false,
      b: false,
      x: false,
      y: false,
      l: false,
      r: false,
      start: false,
      select: false,
      up: false,
      down: false,
      left: false,
      right: false
    };
  }

  addInput(frame, inputState) {
    this.buffer.set(frame, { ...inputState });
    this.lastKnownInput = { ...inputState };
  }

  getInput(frame) {
    if (this.buffer.has(frame)) {
      return this.buffer.get(frame);
    }
    // Return predicted input (last known)
    return { ...this.lastKnownInput };
  }

  isReady(frame) {
    return this.buffer.has(frame);
  }

  prune(beforeFrame) {
    // Remove old inputs to save memory
    for (let [frame] of this.buffer) {
      if (frame < beforeFrame - 60) {
        this.buffer.delete(frame);
      }
    }
  }

  clear() {
    this.buffer.clear();
  }
}

/**
 * MultiplayerSync - Handles input synchronization and frame coordination
 */
export class MultiplayerSync {
  constructor(ws) {
    this.ws = ws;
    this.localInputBuffer = new InputBuffer();
    this.remoteInputBuffer = new InputBuffer();
    this.frameCounter = 0;
    this.maxWaitFrames = 6; // ~100ms at 60 FPS
    this.frameWaitCount = 0;
    this.isReady = false;
    this.isPaused = false;
    this.desyncFrame = null;

    // Checkpoint system
    this.checkpointInterval = 60; // Every 60 frames
    this.lastCheckpointFrame = -1;
    this.remoteCheckpoint = null;

    // Callbacks
    this.onDesync = null;
    this.onPause = null;
    this.onReady = null;

    this.setupWebSocket();
  }

  setupWebSocket() {
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'start') {
        console.log('🚀 Game starting!', message.playerId);
        this.isReady = true;
        if (this.onReady) this.onReady(message.playerId);
      } else if (message.type === 'input') {
        const { packet } = message;
        this.remoteInputBuffer.addInput(packet.frame, packet.buttons);
        console.log(`📥 Received remote input frame ${packet.frame}`);
      } else if (message.type === 'checkpoint') {
        const { checkpoint, playerId } = message;
        this.remoteCheckpoint = { frame: checkpoint.frame, hash: checkpoint.stateHash };
        this.detectDesync(checkpoint.frame, checkpoint.stateHash);
      } else if (message.type === 'pause') {
        console.log('⏸️ Game paused:', message.reason);
        this.isPaused = true;
        if (this.onPause) this.onPause(message.reason);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isPaused = true;
    };

    this.ws.onclose = () => {
      console.error('WebSocket closed');
      this.isPaused = true;
    };
  }

  sendLocalInput(inputState) {
    if (this.ws.readyState !== WebSocket.OPEN) return;

    const packet = {
      frame: this.frameCounter,
      playerId: 'local',
      buttons: inputState,
      timestamp: performance.now()
    };

    this.localInputBuffer.addInput(this.frameCounter, inputState);

    this.ws.send(
      JSON.stringify({
        type: 'input',
        packet
      })
    );
  }

  /**
   * Get input state for given frame
   * Returns actual input if available, or predicted input
   */
  getInputForFrame(frame) {
    return {
      local: this.localInputBuffer.getInput(frame),
      remote: this.remoteInputBuffer.getInput(frame)
    };
  }

  /**
   * Check if we should advance to next frame
   * Returns true if we have both inputs or timeout exceeded
   */
  canAdvanceFrame() {
    const remoteInputReady = this.remoteInputBuffer.isReady(this.frameCounter);

    if (remoteInputReady) {
      this.frameWaitCount = 0;
      return true;
    }

    // Timeout: advance anyway after N frames of waiting
    this.frameWaitCount++;
    if (this.frameWaitCount > this.maxWaitFrames) {
      console.warn(
        `⚠️ Remote input timeout at frame ${this.frameCounter}, using prediction`
      );
      this.frameWaitCount = 0;
      return true;
    }

    return false;
  }

  advanceFrame() {
    this.frameCounter++;
    this.remoteInputBuffer.prune(this.frameCounter);
    this.localInputBuffer.prune(this.frameCounter);
  }

  /**
   * Send checkpoint hash for desync detection
   */
  sendCheckpoint(emulatorStateHash) {
    if (this.frameCounter % this.checkpointInterval !== 0) return;
    if (this.frameCounter === this.lastCheckpointFrame) return;

    this.lastCheckpointFrame = this.frameCounter;

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'checkpoint',
          checkpoint: {
            frame: this.frameCounter,
            stateHash: emulatorStateHash,
            timestamp: performance.now()
          }
        })
      );
      console.log(`✓ Checkpoint sent at frame ${this.frameCounter}`);
    }
  }

  /**
   * Detect desync by comparing state hashes
   */
  detectDesync(remoteFrame, remoteHash) {
    if (remoteFrame === this.frameCounter && this.currentLocalHash !== remoteHash) {
      this.desyncFrame = remoteFrame;
      console.error(`❌ DESYNC DETECTED at frame ${remoteFrame}`);
      console.error(`   Local hash:  ${this.currentLocalHash}`);
      console.error(`   Remote hash: ${remoteHash}`);

      this.isPaused = true;
      if (this.onDesync) {
        this.onDesync({
          frame: remoteFrame,
          localHash: this.currentLocalHash,
          remoteHash
        });
      }
    }
  }

  setLocalHash(hash) {
    this.currentLocalHash = hash;
  }

  reset() {
    this.frameCounter = 0;
    this.frameWaitCount = 0;
    this.localInputBuffer.clear();
    this.remoteInputBuffer.clear();
    this.desyncFrame = null;
    this.isPaused = false;
  }
}
