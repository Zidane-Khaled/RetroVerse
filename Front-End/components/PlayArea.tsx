import React, { useState, useRef, useEffect } from 'react';
import { Upload, Monitor, Save, ArrowLeft, Gamepad, Play } from 'lucide-react';
import { PixelButton } from './PixelButton';

interface PlayAreaProps {
  onCreateAccount: () => void;
  onBack: () => void;
}

export const PlayArea: React.FC<PlayAreaProps> = ({ onCreateAccount, onBack }) => {
  const [romFile, setRomFile] = useState<File | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<string>('nes');
  const [gameState, setGameState] = useState<'idle' | 'setup' | 'playing'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const systems = [
    { id: 'nes', name: 'NES' },
    { id: 'snes', name: 'SNES' },
    { id: 'gb', name: 'Game Boy' },
    { id: 'gba', name: 'Game Boy Advance' },
    { id: 'segaMD', name: 'Sega Genesis' },
    { id: 'n64', name: 'Nintendo 64' },
    { id: 'psx', name: 'PlayStation 1' },
    { id: 'atari2600', name: 'Atari 2600' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRomFile(file);
      setGameState('setup');
    }
  };

  const handleExit = () => {
    // Always go back to Home as requested
    onBack();
  };

  useEffect(() => {
    if (gameState === 'playing' && romFile) {
      const script = document.createElement('script');
      script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
      script.async = true;

      const blobUrl = URL.createObjectURL(romFile);

      // EmulatorJS Configuration
      (window as any).EJS_player = '#emulator';
      (window as any).EJS_gameUrl = blobUrl;
      (window as any).EJS_core = selectedSystem;
      (window as any).EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
      (window as any).EJS_startOnLoaded = true;
      
      // Handle exit from EmulatorJS settings menu
      (window as any).EJS_onClose = () => {
         setGameState('idle');
         setRomFile(null);
      };
      
      document.body.appendChild(script);

      return () => {
        // Cleanup
        if (document.body.contains(script)) {
            document.body.removeChild(script);
        }
        URL.revokeObjectURL(blobUrl);
        delete (window as any).EJS_onClose;
      }
    }
  }, [gameState, romFile, selectedSystem]);

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 gap-6 animate-in fade-in duration-500 h-[calc(100vh-100px)]">
      
      {/* Top Bar */}
      <div className="w-full flex justify-between items-center bg-retro-dark/50 p-2 border-b-2 border-retro-purple">
        <button onClick={handleExit} className="flex items-center gap-2 hover:text-retro-cyan transition-colors font-retro text-xs">
          <ArrowLeft className="w-4 h-4" /> EXIT
        </button>
        <div className="flex items-center gap-2">
            <span className="text-gray-400 font-terminal">MODE:</span>
            <span className="text-retro-yellow font-retro text-xs animate-pulse">GUEST / SOLO</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full h-full min-h-[500px]">
        
        {/* Main Game Screen */}
        <div className="flex-grow relative bg-black border-4 border-gray-700 shadow-[0_0_50px_rgba(74,14,143,0.3)] rounded-lg overflow-hidden flex flex-col items-center justify-center">
             
             {/* TV Scanlines Effect (Only visible when not playing or as overlay) */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 pointer-events-none bg-[length:100%_4px,3px_100%] opacity-50"></div>
             
             {gameState === 'idle' && (
               <div className="z-10 text-center space-y-6 p-8 animate-in zoom-in duration-300">
                  <Monitor className="w-24 h-24 text-gray-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-retro text-retro-cyan mb-2">NO CARTRIDGE INSERTED</h2>
                  <p className="font-terminal text-xl text-gray-400 max-w-md">
                    Drag and drop your ROM file here or click below to browse your local library.
                  </p>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".nes,.snes,.smc,.gba,.gb,.bin,.md,.gen,.iso,.zip,.z64,.n64"
                  />
                  
                  <PixelButton onClick={() => fileInputRef.current?.click()} variant="primary">
                    <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        INSERT ROM
                    </div>
                  </PixelButton>
               </div>
             )}

             {gameState === 'setup' && (
               <div className="z-30 text-center space-y-6 p-8 w-full max-w-md animate-in slide-in-from-bottom duration-300">
                  <div className="bg-retro-dark border-2 border-retro-purple p-6 shadow-pixel relative">
                      <div className="absolute -top-2 -left-2 w-4 h-4 bg-retro-cyan border-2 border-white"></div>
                      <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-retro-pink border-2 border-white"></div>
                      
                      <h2 className="font-retro text-retro-yellow mb-6 text-sm">GAME CONFIGURATION</h2>
                      
                      <div className="text-left space-y-4">
                        <div>
                            <label className="font-retro text-[10px] text-gray-400 block mb-2">SELECTED ROM</label>
                            <div className="font-terminal text-retro-cyan truncate bg-black/50 p-2 border border-gray-700 text-lg">
                                {romFile?.name}
                            </div>
                        </div>

                        <div>
                            <label className="font-retro text-[10px] text-gray-400 block mb-2">SELECT SYSTEM</label>
                            <div className="relative">
                                <Gamepad className="absolute left-2 top-2.5 w-5 h-5 text-gray-500" />
                                <select 
                                    value={selectedSystem} 
                                    onChange={(e) => setSelectedSystem(e.target.value)}
                                    className="w-full bg-black/50 text-white font-terminal text-xl p-2 pl-10 border border-retro-cyan focus:outline-none focus:border-retro-pink appearance-none cursor-pointer"
                                >
                                    {systems.map(sys => (
                                        <option key={sys.id} value={sys.id}>{sys.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 space-y-3">
                            <PixelButton onClick={() => setGameState('playing')} variant="primary" className="w-full flex justify-center">
                                <div className="flex items-center gap-2">
                                    <Play className="w-4 h-4" />
                                    START GAME
                                </div>
                            </PixelButton>
                            
                            <button onClick={() => { setGameState('idle'); setRomFile(null); }} className="w-full text-center font-terminal text-gray-500 hover:text-white transition-colors">
                                CANCEL
                            </button>
                        </div>
                      </div>
                  </div>
               </div>
             )}

             {/* Emulator Container */}
             {gameState === 'playing' && (
                 <div className="w-full h-full z-10 bg-black">
                     <div id="emulator" className="w-full h-full"></div>
                 </div>
             )}
        </div>

        {/* Sidebar Controls */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
            {/* CTA Box */}
            <div className="bg-retro-dark border-2 border-retro-pink p-4 shadow-pixel">
                <h3 className="font-retro text-xs text-retro-pink mb-4">SAVE YOUR GAME?</h3>
                <PixelButton onClick={onCreateAccount} variant="secondary" className="w-full text-xs py-2">
                    <div className="flex items-center justify-center gap-2">
                        <Save className="w-3 h-3" />
                        CREATE ACCOUNT
                    </div>
                </PixelButton>
            </div>
        </div>
      </div>
    </div>
  );
};