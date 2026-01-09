import React, { useEffect, useRef } from 'react';

interface ScreenProps {
  onMount: (canvas: HTMLCanvasElement) => void;
  isPlaying: boolean;
}

const Screen: React.FC<ScreenProps> = ({ onMount, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      onMount(canvasRef.current);
    }
  }, [onMount]);

  return (
    <div className="relative w-full max-w-[640px] aspect-[256/240] mx-auto bg-black rounded-lg overflow-hidden shadow-[0_0_50px_rgba(233,69,96,0.3)] border-4 border-retro-700">
      {/* Actual Emulator Canvas */}
      <canvas
        ref={canvasRef}
        width={256}
        height={240}
        className="w-full h-full object-contain image-pixelated"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* CRT Overlay Effects */}
      <div className="absolute inset-0 pointer-events-none scanline opacity-30"></div>
      <div className="absolute inset-0 pointer-events-none crt-flicker mix-blend-overlay bg-gradient-to-b from-transparent via-[rgba(255,255,255,0.05)] to-transparent bg-[length:100%_4px]"></div>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]"></div>

      {/* Screen Off / No Game State */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <div className="text-retro-300 font-mono text-center">
                <p className="text-xl animate-pulse">NO CARTRIDGE LOADED</p>
                <p className="text-sm text-retro-100 mt-2 opacity-60">INSERT ROM TO START</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default Screen;
