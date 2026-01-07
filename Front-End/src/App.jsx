import { useState, useEffect, useRef } from 'react';
import './App.css';
import { MultiplayerSync } from './multiplayer';
import { useJsnesEmulator } from './useJsnesEmulator';
import { useInput } from './useInput';

function App() {
  const [gameState, setGameState] = useState('connecting'); // connecting, waiting, playing, paused, desync
  const [wsUrl, setWsUrl] = useState('ws://localhost:8080');
  const [customUrl, setCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [frameInfo, setFrameInfo] = useState({ frame: 0 });
  const [desyncInfo, setDesyncInfo] = useState(null);
  const [isRomLoaded, setIsRomLoaded] = useState(false);

  const wsRef = useRef(null);
  const multiplayerRef = useRef(null);
  const inputRef = useRef(null);
  const emulator = useJsnesEmulator({ multiplayer: multiplayerRef.current });

  // Initialize input handler
  useEffect(() => {
    inputRef.current = useInput((input) => {
      if (multiplayerRef.current) {
        multiplayerRef.current.sendLocalInput(input);
      }
    });

    inputRef.current.setupListeners();

    return () => {
      inputRef.current?.removeListeners();
    };
  }, []);

  // Update frame info from emulator
  useEffect(() => {
    const interval = setInterval(() => {
      if (multiplayerRef.current) {
        setFrameInfo({ frame: multiplayerRef.current.frameCounter });
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Connect to server
  const connectToServer = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const url = customUrl || wsUrl;
    console.log(`🔌 Connecting to ${url}...`);
    setGameState('connecting');

    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('✓ Connected to server');
      multiplayerRef.current = new MultiplayerSync(ws);

      multiplayerRef.current.onReady = (playerId) => {
        console.log(`✓ Ready as ${playerId}`);
        setGameState('waiting');
      };

      multiplayerRef.current.onPause = (reason) => {
        setGameState('paused');
        console.log(`Game paused: ${reason}`);
      };

      multiplayerRef.current.onDesync = (info) => {
        setGameState('desync');
        setDesyncInfo(info);
        console.log('Desync detected:', info);
      };

      wsRef.current = ws;
    };

    ws.onerror = (error) => {
      console.error('Connection error:', error);
      setGameState('connecting');
    };

    ws.onclose = () => {
      console.log('Disconnected from server');
      setGameState('connecting');
    };
  };

  const startGame = () => {
    if (!isRomLoaded) {
      alert('Please load a ROM first');
      return;
    }
    if (!multiplayerRef.current?.isReady) {
      alert('Waiting for opponent...');
      return;
    }

    setGameState('playing');
    emulator.resume();
  };

  const handleRomUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const romData = new Uint8Array(event.target.result);
        emulator.loadROM(romData);
        setIsRomLoaded(true);
        console.log(`✓ ROM loaded: ${file.name}`);
      } catch (err) {
        console.error('Failed to load ROM:', err);
        alert('Failed to load ROM');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleRomUrl = async () => {
    const url = prompt('Enter ROM URL:');
    if (!url) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const romData = new Uint8Array(arrayBuffer);
      emulator.loadROM(romData);
      setIsRomLoaded(true);
      console.log(`✓ ROM loaded from URL`);
    } catch (err) {
      console.error('Failed to load ROM from URL:', err);
      alert('Failed to load ROM');
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>🎮 jsnes Multiplayer</h1>

        {/* Connection Panel */}
        <div className="panel connection-panel">
          <h2>1. Connect to Server</h2>
          {!showUrlInput ? (
            <>
              <p className="status" data-state={gameState}>
                Status: <strong>{gameState.toUpperCase()}</strong>
              </p>
              <button
                onClick={() => setShowUrlInput(true)}
                className="btn btn-secondary"
              >
                Custom Server URL
              </button>
            </>
          ) : (
            <div className="url-input-group">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="ws://localhost:8080"
              />
              <button onClick={() => setShowUrlInput(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          )}
          <button onClick={connectToServer} className="btn btn-primary">
            {wsRef.current ? 'Reconnect' : 'Connect'}
          </button>
        </div>

        {/* ROM Loading Panel */}
        {gameState !== 'connecting' && (
          <div className="panel rom-panel">
            <h2>2. Load ROM</h2>
            <div className="rom-buttons">
              <label className="btn btn-primary">
                Upload ROM
                <input
                  type="file"
                  accept=".nes"
                  onChange={handleRomUpload}
                  style={{ display: 'none' }}
                />
              </label>
              <button onClick={handleRomUrl} className="btn btn-primary">
                Load from URL
              </button>
            </div>
            {isRomLoaded && <p className="status status-success">✓ ROM loaded</p>}
          </div>
        )}

        {/* Game Panel */}
        {gameState !== 'connecting' && (
          <div className="panel game-panel">
            <h2>3. Game</h2>
            <div className="canvas-wrapper">
              <canvas
                ref={emulator.canvasRef}
                width={256}
                height={240}
                className="game-canvas"
              />
            </div>

            <div className="controls">
              <button
                onClick={startGame}
                disabled={gameState === 'connecting' || !isRomLoaded}
                className="btn btn-success"
              >
                {gameState === 'playing' ? '▶ Playing' : '▶ Start Game'}
              </button>
              {gameState === 'playing' && (
                <button
                  onClick={() => {
                    setGameState('paused');
                    emulator.pause();
                  }}
                  className="btn btn-warning"
                >
                  ⏸ Pause
                </button>
              )}
            </div>

            <div className="frame-info">
              <p>Frame: {frameInfo.frame}</p>
              <p>Ready: {multiplayerRef.current?.isReady ? '✓' : '✗'}</p>
            </div>
          </div>
        )}

        {/* Desync Panel */}
        {gameState === 'desync' && (
          <div className="panel error-panel">
            <h2>❌ Network Desynchronization</h2>
            <p>
              Game state diverged at <strong>frame {desyncInfo?.frame}</strong>
            </p>
            <div className="error-details">
              <p>Local: {desyncInfo?.localHash}</p>
              <p>Remote: {desyncInfo?.remoteHash}</p>
            </div>
            <button onClick={() => window.location.reload()} className="btn btn-danger">
              Reload Game
            </button>
          </div>
        )}

        {/* Info Panel */}
        <div className="panel info-panel">
          <h2>Controls</h2>
          <div className="controls-info">
            <p><strong>Arrows:</strong> D-Pad</p>
            <p><strong>Z/X:</strong> A/B</p>
            <p><strong>A/S:</strong> Y/X</p>
            <p><strong>Q/W:</strong> L/R</p>
            <p><strong>Enter:</strong> Start</p>
            <p><strong>Space:</strong> Select</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

