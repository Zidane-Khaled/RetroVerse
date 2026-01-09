export interface ROMData {
  name: string;
  data: string; // Binary string
}

export enum EmulatorState {
  STOPPED = 'STOPPED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
}

export interface ControllerMapping {
  [key: string]: number; // KeyCode to NES Button ID
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// JSNES Type Definitions (simplified for this implementation)
export interface JSNESInstance {
  loadROM: (data: string) => void;
  frame: () => void;
  buttonDown: (controller: number, button: number) => void;
  buttonUp: (controller: number, button: number) => void;
  reset: () => void;
  opts: {
    onFrame: (buffer: number[]) => void;
    onAudioSample: (left: number, right: number) => void;
    emulateSound: boolean;
    sampleRate: number;
  };
}
