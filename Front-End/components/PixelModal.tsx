import React from 'react';
import { X } from 'lucide-react';

interface PixelModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const PixelModal: React.FC<PixelModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative bg-retro-dark border-4 border-white p-1 w-full max-w-md shadow-pixel animate-float">
        {/* Inner Border */}
        <div className="border-4 border-retro-purple p-6">
            <div className="flex justify-between items-center mb-6 border-b-2 border-dashed border-gray-600 pb-4">
            <h2 className="font-retro text-retro-yellow text-sm md:text-base drop-shadow-md">{title}</h2>
            <button 
                onClick={onClose}
                className="text-white hover:text-retro-pink transition-colors"
            >
                <X className="w-6 h-6" />
            </button>
            </div>
            
            <div className="font-terminal text-lg">
                {children}
            </div>
        </div>
        
        {/* Decor Corners */}
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-retro-cyan" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-retro-cyan" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-retro-cyan" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-retro-cyan" />
      </div>
    </div>
  );
};