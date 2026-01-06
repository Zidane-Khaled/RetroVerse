import React, { useState } from 'react';
import { ArrowLeft, User, Lock, Mail, Key, Shield, AlertTriangle, Loader } from 'lucide-react';
import { PixelButton } from './PixelButton';
import { authService } from '../utils/auth';

interface AuthPageProps {
  onBack: () => void;
  onAuthSuccess: (user: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user types
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Basic Validation
      if (!formData.username || !formData.password || (!isLogin && !formData.email)) {
        throw new Error("MISSING_FIELDS");
      }

      let user;
      if (isLogin) {
        user = await authService.login(formData.username, formData.password);
      } else {
        user = await authService.register(formData.username, formData.email, formData.password);
      }
      
      onAuthSuccess(user);
    } catch (err: any) {
      let errorMessage = "SYSTEM_ERROR";
      if (err.message === "USERNAME_TAKEN") errorMessage = "ERROR: USERNAME ALREADY EXISTS";
      if (err.message === "EMAIL_REGISTERED") errorMessage = "ERROR: EMAIL ALREADY REGISTERED";
      if (err.message === "INVALID_CREDENTIALS") errorMessage = "ERROR: INVALID CREDENTIALS";
      if (err.message === "MISSING_FIELDS") errorMessage = "ERROR: ALL FIELDS REQUIRED";
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="relative w-full max-w-md">
        
        {/* Decorative Background Elements */}
        <div className="absolute -inset-1 bg-gradient-to-r from-retro-purple to-retro-pink blur opacity-40"></div>
        
        <div className="relative bg-retro-dark border-4 border-white shadow-pixel p-1">
          <div className="border-4 border-retro-purple p-8 flex flex-col gap-6">
            
            {/* Header / Tabs */}
            <div className="flex justify-center border-b-2 border-dashed border-gray-600 pb-6 gap-8">
              <button 
                onClick={() => { setIsLogin(true); setError(null); }}
                className={`font-retro text-sm transition-all ${isLogin ? 'text-retro-cyan scale-110 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]' : 'text-gray-500 hover:text-white'}`}
              >
                LOGIN
              </button>
              <button 
                onClick={() => { setIsLogin(false); setError(null); }}
                className={`font-retro text-sm transition-all ${!isLogin ? 'text-retro-pink scale-110 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]' : 'text-gray-500 hover:text-white'}`}
              >
                REGISTER
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/50 border-2 border-red-500 p-2 flex items-center gap-2 text-red-300 text-xs font-terminal animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Form */}
            <div className="space-y-4 font-terminal">
              
              {!isLogin && (
                <div className="group">
                  <label className="text-xs text-retro-yellow block mb-1">EMAIL_ADDRESS</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 w-5 h-5 text-gray-400 group-focus-within:text-retro-yellow" />
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-black/50 border-2 border-gray-600 p-3 pl-10 text-white focus:outline-none focus:border-retro-yellow transition-colors"
                      placeholder="player@retro.verse"
                    />
                  </div>
                </div>
              )}

              <div className="group">
                <label className="text-xs text-retro-cyan block mb-1">USERNAME</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-5 h-5 text-gray-400 group-focus-within:text-retro-cyan" />
                  <input 
                    type="text" 
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full bg-black/50 border-2 border-gray-600 p-3 pl-10 text-white focus:outline-none focus:border-retro-cyan transition-colors"
                    placeholder="PLAYER_ONE"
                  />
                </div>
              </div>

              <div className="group">
                <label className="text-xs text-retro-pink block mb-1">PASSWORD</label>
                <div className="relative flex items-center">
                  <Key className="absolute left-3 w-5 h-5 text-gray-400 group-focus-within:text-retro-pink" />
                  <input 
                    type="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-black/50 border-2 border-gray-600 p-3 pl-10 text-white focus:outline-none focus:border-retro-pink transition-colors"
                    placeholder="******"
                  />
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="pt-4 space-y-4">
              <PixelButton 
                variant="primary" 
                onClick={handleSubmit} 
                className={`w-full flex justify-center items-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    PROCESSING...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    {isLogin ? 'ENTER SYSTEM' : 'INITIALIZE USER'}
                  </>
                )}
              </PixelButton>
              
              <button 
                onClick={onBack}
                disabled={isLoading}
                className="w-full text-center text-gray-500 font-terminal hover:text-white text-sm flex items-center justify-center gap-2 hover:translate-x-1 transition-transform disabled:opacity-50"
              >
                <ArrowLeft className="w-3 h-3" /> ABORT SEQUENCE
              </button>
            </div>

          </div>
          
          {/* Pixel Corners */}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-white" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white" />

        </div>
      </div>
    </div>
  );
};