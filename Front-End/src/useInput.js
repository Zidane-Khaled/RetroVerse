/**
 * useInput - Keyboard input capture for SNES controller
 */
export function useInput(onInputChange) {
  const keyMap = {
    // Player 1 Controls
    'z': 'a',          // Z = A button
    'x': 'b',          // X = B button
    'a': 'y',          // A = Y button
    's': 'x',          // S = X button
    'q': 'l',          // Q = L button
    'w': 'r',          // W = R button
    'enter': 'start',  // Enter = Start
    ' ': 'select',     // Space = Select
    'arrowup': 'up',
    'arrowdown': 'down',
    'arrowleft': 'left',
    'arrowright': 'right'
  };

  const currentInput = {
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

  const handleKeyDown = (e) => {
    const key = e.key.toLowerCase();
    const button = keyMap[key];

    if (button && currentInput.hasOwnProperty(button)) {
      currentInput[button] = true;
      e.preventDefault();
      if (onInputChange) onInputChange({ ...currentInput });
    }
  };

  const handleKeyUp = (e) => {
    const key = e.key.toLowerCase();
    const button = keyMap[key];

    if (button && currentInput.hasOwnProperty(button)) {
      currentInput[button] = false;
      e.preventDefault();
      if (onInputChange) onInputChange({ ...currentInput });
    }
  };

  return {
    setupListeners: () => {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    },
    removeListeners: () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    },
    getInput: () => ({ ...currentInput })
  };
}
