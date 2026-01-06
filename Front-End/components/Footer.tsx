import React from 'react';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full p-8 border-t-4 border-retro-purple bg-retro-dark relative overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        <div className="text-center md:text-left">
           <h2 className="font-retro text-retro-cyan text-sm mb-2">RetroVerse</h2>
           <p className="font-terminal text-gray-400">© 2024. All pixels reserved.</p>
        </div>

        <div className="flex items-center gap-2 font-terminal text-xl text-white">
          <span>Created by</span>
          <span className="text-retro-pink font-bold border-b-2 border-retro-pink hover:bg-retro-pink hover:text-white transition-colors cursor-default px-1">
            zidane khaled
          </span>
          <Heart className="w-4 h-4 text-retro-pink animate-pulse" />
        </div>

        <div className="flex gap-4">
            {/* Social Icons (Pixels) */}
            <div className="w-8 h-8 bg-gray-800 border-2 border-gray-600 hover:border-retro-yellow hover:bg-retro-yellow/20 cursor-pointer flex items-center justify-center transition-colors">
                <span className="font-retro text-[8px]">TW</span>
            </div>
            <div className="w-8 h-8 bg-gray-800 border-2 border-gray-600 hover:border-retro-pink hover:bg-retro-pink/20 cursor-pointer flex items-center justify-center transition-colors">
                <span className="font-retro text-[8px]">IG</span>
            </div>
        </div>
      </div>
    </footer>
  );
};