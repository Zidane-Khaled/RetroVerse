import React from 'react';
import { PixelButton } from './PixelButton';
import { Play, UserPlus, Star } from 'lucide-react';

interface HeroProps {
  onCreateAccount: () => void;
  onPlaySolo: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onCreateAccount, onPlaySolo }) => {
  return (
    <div className="relative flex flex-col items-center justify-center text-center space-y-10 max-w-4xl mx-auto z-10">
      
      {/* Floating Decorative Elements */}
      <div className="absolute -top-20 -left-20 animate-float hidden md:block text-retro-yellow opacity-80">
         <Star className="w-12 h-12" />
      </div>
      <div className="absolute top-1/2 -right-24 animate-pulse-fast hidden md:block text-retro-pink opacity-80">
         <div className="w-4 h-4 bg-retro-pink shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]"></div>
         <div className="w-4 h-4 bg-retro-cyan shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] translate-x-4"></div>
      </div>

      <div className="space-y-4">
        <div className="inline-block px-4 py-2 bg-retro-purple/50 border-2 border-retro-cyan rounded-none mb-4 transform -rotate-2">
            <span className="font-retro text-xs text-retro-cyan tracking-widest">WELCOME TO THE ARCADE</span>
        </div>
        <h1 className="text-4xl md:text-7xl font-retro leading-tight">
          <span className="block text-white drop-shadow-[4px_4px_0_#4a0e8f]">LEVEL UP</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-retro-pink to-retro-yellow drop-shadow-[4px_4px_0_#4a0e8f]">YOUR REALITY</span>
        </h1>
        <p className="font-terminal text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto bg-black/40 p-2 border-l-4 border-retro-green">
          Dive into a universe of 8-bit wonders. Compete, collaborate, and conquer in the ultimate retro gaming playground.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full md:w-auto mt-8">
        <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-retro-cyan to-blue-600 rounded-none blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <PixelButton variant="primary" onClick={onCreateAccount} className="w-full md:w-64 flex items-center justify-center gap-3">
                <UserPlus className="w-5 h-5" />
                <span>Create Account</span>
            </PixelButton>
        </div>
        
        <div className="group relative">
             <div className="absolute -inset-1 bg-gradient-to-r from-retro-pink to-purple-600 rounded-none blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <PixelButton variant="secondary" onClick={onPlaySolo} className="w-full md:w-64 flex items-center justify-center gap-3">
                <Play className="w-5 h-5" />
                <span>Play Solo</span>
            </PixelButton>
        </div>
      </div>

      <div className="mt-8 font-retro text-[10px] text-gray-500 animate-pulse">
        INSERT COIN TO START
      </div>
    </div>
  );
};