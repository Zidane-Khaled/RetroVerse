import React, { useState, useEffect } from 'react';
import { RetroBackground } from './components/RetroBackground';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Footer } from './components/Footer';
import { Gamepad2, Trophy, Users } from 'lucide-react';
import { PlayArea } from './components/PlayArea';
import { AuthPage } from './components/AuthPage';
import { authService, User } from './utils/auth';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'play' | 'auth'>('home');
  const [user, setUser] = useState<User | null>(null);

  // Check for existing session on load
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const handleLogoClick = () => {
    setCurrentView('home');
  };

  const handleAuthSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentView('home');
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setCurrentView('home');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'auth':
        return <AuthPage onBack={() => setCurrentView('home')} onAuthSuccess={handleAuthSuccess} />;
      case 'play':
        return (
          <PlayArea 
            onCreateAccount={() => setCurrentView('auth')} 
            onBack={() => setCurrentView('home')} 
          />
        );
      case 'home':
      default:
        return (
          <>
            <div className="flex-grow flex items-center justify-center p-4">
              <Hero 
                onCreateAccount={() => setCurrentView('auth')} 
                onPlaySolo={() => setCurrentView('play')} 
              />
            </div>

            <section className="py-12 px-4 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8">
               <FeatureCard 
                 icon={<Gamepad2 className="w-8 h-8 text-retro-cyan" />}
                 title="Classic Games"
                 description="Jump into a vast library of 8-bit and 16-bit classics remastered for the web."
               />
               <FeatureCard 
                 icon={<Users className="w-8 h-8 text-retro-pink" />}
                 title="Multiplayer"
                 description="Challenge friends or meet new rivals in our retro-styled lobbies."
               />
               <FeatureCard 
                 icon={<Trophy className="w-8 h-8 text-retro-yellow" />}
                 title="Leaderboards"
                 description="Compete for the high score and immortalize your name in the Hall of Fame."
               />
            </section>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen text-white font-terminal relative flex flex-col">
      {/* Background Layer */}
      <RetroBackground />
      
      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header 
          onLogoClick={handleLogoClick} 
          user={user} 
          onLogout={handleLogout}
        />
        
        <main className="flex-grow flex flex-col">
          {renderContent()}
        </main>

        <Footer />
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{icon: React.ReactNode, title: string, description: string}> = ({ icon, title, description }) => (
  <div className="bg-retro-dark/80 backdrop-blur-sm border-2 border-retro-purple p-6 hover:-translate-y-2 transition-transform duration-300 shadow-pixel group">
    <div className="mb-4 group-hover:animate-bounce">{icon}</div>
    <h3 className="font-retro text-retro-yellow text-sm mb-2">{title}</h3>
    <p className="text-gray-300 font-terminal text-lg leading-tight">{description}</p>
  </div>
);

export default App;