import React from 'react';

interface PixelButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  className?: string;
}

export const PixelButton: React.FC<PixelButtonProps> = ({ 
  children, 
  variant = 'primary', 
  onClick,
  className = ''
}) => {
  const baseStyles = "relative px-8 py-4 font-retro text-sm uppercase transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0.5 focus:outline-none";
  
  const variants = {
    primary: "bg-retro-cyan text-retro-dark border-4 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] hover:shadow-[6px_6px_0px_0px_#ff0055] hover:border-retro-pink hover:text-retro-pink",
    secondary: "bg-transparent text-white border-4 border-retro-purple shadow-[4px_4px_0px_0px_#4a0e8f] hover:bg-retro-purple hover:text-white hover:shadow-[6px_6px_0px_0px_#00f0ff] hover:border-retro-cyan",
  };

  return (
    <button 
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
       {/* Pixel corners effect visualization handled by border-4 mostly, but we can add inner glint */}
      {children}
    </button>
  );
};