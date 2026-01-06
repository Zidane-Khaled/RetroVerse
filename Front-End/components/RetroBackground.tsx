import React from 'react';

export const RetroBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-retro-dark">
      {/* Grid Floor Effect */}
      <div 
        className="absolute bottom-0 w-full h-1/2 opacity-20"
        style={{
          background: 'linear-gradient(transparent 0%, #4a0e8f 100%)',
          transform: 'perspective(500px) rotateX(60deg) translateY(100px) scale(2)',
        }}
      >
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: 'linear-gradient(to right, #ff0055 1px, transparent 1px), linear-gradient(to bottom, #ff0055 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            animation: 'float 20s linear infinite' // Reusing float animation generically or could define a specific scroll
          }}
        />
      </div>

      {/* Floating Pixels / Stars */}
      {[...Array(20)].map((_, i) => {
        const size = Math.random() * 4 + 2;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = Math.random() * 10 + 10;
        
        return (
          <div
            key={i}
            className="absolute bg-white animate-twinkle opacity-60"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              top: `${top}%`,
              animationDelay: `${delay}s`,
              boxShadow: `0 0 ${size * 2}px ${i % 2 === 0 ? '#00f0ff' : '#ff0055'}`,
            }}
          />
        );
      })}

      {/* Scanline Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-4 w-full animate-scanline pointer-events-none opacity-30" />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0f0f23_90%)]" />
    </div>
  );
};