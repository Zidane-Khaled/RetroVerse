import React from 'react';
import { Gamepad2, UserCircle, LogOut } from 'lucide-react';

interface User {
  username: string;
}

interface HeaderProps {
  onLogoClick?: () => void;
  user?: User | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick, user, onLogout }) => {
  return (
    <header className="w-full p-4 md:p-6 flex justify-between items-center border-b-4 border-retro-purple bg-retro-dark/90 backdrop-blur z-50 sticky top-0">
      <div onClick={onLogoClick} className="flex items-center gap-3 group cursor-pointer">
        <div className="relative">
          <Gamepad2 className="w-8 h-8 md:w-10 md:h-10 text-retro-cyan group-hover:text-retro-pink transition-colors duration-300" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-retro-yellow animate-ping" />
        </div>
        <h1 className="font-retro text-lg md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-retro-cyan via-white to-retro-pink drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          RetroVerse
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
           <div className="flex items-center gap-4 animate-in slide-in-from-right duration-500">
             <div className="flex flex-col items-end">
                <span className="font-retro text-[10px] text-gray-400">PLAYER 1</span>
                <span className="font-terminal text-retro-yellow text-xl leading-none uppercase">{user.username}</span>
             </div>
             <button 
                onClick={onLogout}
                className="bg-retro-dark border-2 border-red-500 p-2 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                title="Logout"
             >
                <LogOut className="w-4 h-4" />
             </button>
           </div>
        ) : (
          <div className="hidden md:block">
             <div className="flex items-center gap-1 opacity-50">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-terminal text-sm text-gray-400">OFFLINE</span>
             </div>
          </div>
        )}
      </div>
    </header>
  );
};