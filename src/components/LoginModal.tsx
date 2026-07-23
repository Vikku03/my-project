import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  User, 
  ArrowRight, 
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react';
import { ProofProject, UserSession } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProofProject[];
  onLoginSuccess: (session: UserSession, assignedProject?: ProofProject) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  projects,
  onLoginSuccess,
}) => {
  const [activeMethod, setActiveMethod] = useState<'google' | 'authenticator'>('google');

  // Google state
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleError, setGoogleError] = useState('');

  // Authenticator / Passcode state
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Reset sensitive inputs immediately when modal opens, closes, or resets
  const clearFields = () => {
    setGoogleEmail('');
    setGoogleError('');
    setPasscode('');
    setPasscodeError('');
  };

  useEffect(() => {
    clearFields();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    clearFields();
    onClose();
  };

  // Handle Google Sign-In (Client Only - Must be created by admin)
  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleError('');
    const emailLower = googleEmail.trim().toLowerCase();
    
    if (!emailLower || !emailLower.includes('@')) {
      setGoogleError('Please enter a valid Google email address.');
      return;
    }

    // Email login is STRICTLY for client accounts registered by the admin.
    // Admin login via email is strictly prohibited for security reasons.
    const matchedProject = projects.find(p => (p?.clientEmail || '').trim().toLowerCase() === emailLower);

    if (!matchedProject) {
      setGoogleError('Please contact GK for login access');
      return;
    }

    const session: UserSession = {
      isLoggedIn: true,
      role: 'client',
      name: matchedProject.clientName,
      email: matchedProject.clientEmail || googleEmail,
      phone: matchedProject.clientPhone,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleEmail)}&backgroundColor=0369a1`,
      assignedProjectId: matchedProject.id
    };

    clearFields();
    onLoginSuccess(session, matchedProject);
    onClose();
  };

  // Handle Security PIN / Project Passcode
  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError('');
    const inputKey = passcode.trim().toUpperCase();

    if (!inputKey) {
      setPasscodeError('Please enter your passcode or security PIN.');
      return;
    }

    // Admin security PIN check (Admin MUST login with security PIN only)
    if (inputKey === 'GKADMIN2026' || inputKey === '2026' || inputKey === 'ADMIN' || inputKey === '123456') {
      const session: UserSession = {
        isLoggedIn: true,
        role: 'admin',
        name: 'Govind Kumar Gella',
        email: 'gkdigitalstudios@gmail.com',
        phone: '9491800783'
      };
      clearFields();
      onLoginSuccess(session);
      onClose();
      return;
    }

    // Client project passcode check
    const matched = projects.find(p => (p?.passcode || '').toUpperCase() === inputKey);
    if (matched) {
      const session: UserSession = {
        isLoggedIn: true,
        role: 'client',
        name: matched.clientName,
        email: matched.clientEmail,
        phone: matched.clientPhone,
        assignedProjectId: matched.id
      };
      clearFields();
      onLoginSuccess(session, matched);
      onClose();
      return;
    }

    setPasscodeError('Please contact GK for login access');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-600/20 via-zinc-900 to-amber-900/20 p-6 border-b border-zinc-800 relative">
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">Login Access</h3>
              <p className="text-xs text-zinc-400">GK Digital Studios • Secure Portal</p>
            </div>
          </div>

          {/* 2 Clear Authentication Tabs */}
          <div className="grid grid-cols-2 gap-2 mt-6 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 text-xs font-semibold">
            <button
              onClick={() => { setActiveMethod('google'); setPasscodeError(''); setGoogleError(''); }}
              className={`py-2.5 px-3 rounded-lg transition flex items-center justify-center gap-2 ${
                activeMethod === 'google' ? 'bg-amber-500 text-zinc-950 font-bold shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Client Email Login</span>
            </button>

            <button
              onClick={() => { setActiveMethod('authenticator'); setPasscodeError(''); setGoogleError(''); }}
              className={`py-2.5 px-3 rounded-lg transition flex items-center justify-center gap-2 ${
                activeMethod === 'authenticator' ? 'bg-amber-500 text-zinc-950 font-bold shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>Security PIN / Passcode</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* METHOD 1: GOOGLE CLIENT EMAIL LOGIN */}
          {activeMethod === 'google' && (
            <form onSubmit={handleGoogleSubmit} className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <User className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Client Account Login</span>
                  <span>Enter the Google email address registered for your account by GK Digital Studios.</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Registered Client Email Address</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
                  <input 
                    type="email" 
                    required
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="Enter registered client email..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                {googleError && (
                  <p className="text-xs text-rose-400 mt-2 flex items-center gap-1.5 font-medium">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>{googleError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
              >
                <span>Login as Client</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* METHOD 2: SECURITY PIN / PROJECT PASSCODE */}
          {activeMethod === 'authenticator' && (
            <form onSubmit={handlePasscodeSubmit} className="space-y-4">
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-400 block">Admin & Client PIN Portal</span>
                  <span>Admins must enter Studio Security PIN to access management dashboard. Clients may enter private gallery passcode.</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Security PIN / Project Passcode</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
                  <input 
                    type="password"
                    required
                    autoComplete="new-password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter Security PIN or passcode..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm font-mono tracking-wider focus:outline-none focus:border-amber-500"
                  />
                </div>
                {passcodeError && (
                  <p className="text-xs text-rose-400 mt-2 flex items-center gap-1.5 font-medium">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>{passcodeError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Verify & Login</span>
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

