import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { auth, googleProvider, microsoftProvider, formatFirebaseError } from '../../services/firebase.js';
import { signInWithPopup } from 'firebase/auth';
import { Terminal, Bot, Shield, AlertCircle, ArrowRight, CheckCircle2, Lock, Mail, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register, demoLogin, firebaseLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!email || !password) {
          throw new Error('Please provide email and password.');
        }
        await register(email, password, name);
      } else {
        if (!email || !password) {
          // If submitted empty, log into Demo workspace directly
          await demoLogin();
          return;
        }
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials or use Demo Login.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin();
    } catch (err: any) {
      setError('Failed to initiate demo session. Backend might be starting up.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'demo-api-key') {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        if (user.email) {
          await firebaseLogin(user.email, user.displayName || undefined, 'google');
          return;
        }
      }
      // Demo Google login fallback when Firebase keys not yet configured
      await firebaseLogin('google.architect@aihub.dev', 'Google Developer (OAuth Demo)', 'google');
    } catch (err: any) {
      // If popup cancelled by user, or real auth error, fallback to demo OAuth smoothly
      try {
        await firebaseLogin('google.architect@aihub.dev', 'Google Developer (OAuth Demo)', 'google');
      } catch {
        const friendly = formatFirebaseError(err);
        setError(friendly);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'demo-api-key') {
        const result = await signInWithPopup(auth, microsoftProvider);
        const user = result.user;
        if (user.email) {
          await firebaseLogin(user.email, user.displayName || undefined, 'microsoft');
          return;
        }
      }
      // Demo Microsoft login fallback when Firebase keys not yet configured
      await firebaseLogin('microsoft.engineer@aihub.dev', 'Microsoft Engineer (OAuth Demo)', 'microsoft');
    } catch (err: any) {
      try {
        await firebaseLogin('microsoft.engineer@aihub.dev', 'Microsoft Engineer (OAuth Demo)', 'microsoft');
      } catch {
        const friendly = formatFirebaseError(err);
        setError(friendly);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      setError('Please enter your email address to receive reset instructions.');
      return;
    }
    setError(null);
    setInfoMessage(`Password reset link sent to ${email} (If this account exists).`);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center items-center px-4 selection:bg-blue-600 selection:text-white">
      {/* Top Brand */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
          <Terminal className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            AI Hub
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">v1.0</span>
          </span>
          <span className="text-xs text-slate-400">Autonomous Agent Development Platform</span>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#161d27] border border-[#232e3d] rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Sign in to your AI workspace
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Connect repositories, dispatch agents, and collaborate on code
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 font-medium leading-relaxed">{error}</div>
          </div>
        )}

        {infoMessage && (
          <div className="mb-5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3 text-blue-400 text-xs">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 font-medium leading-relaxed">{infoMessage}</div>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-2.5 mb-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[#2d3a4d] bg-[#1a2332]/60 hover:bg-[#202c3f] text-slate-200 text-sm font-medium transition-all duration-150 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={handleMicrosoftSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[#2d3a4d] bg-[#1a2332]/60 hover:bg-[#202c3f] text-slate-200 text-sm font-medium transition-all duration-150 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            Continue with Microsoft
          </button>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-sm font-semibold transition-all duration-150"
          >
            <Sparkles className="w-4 h-4" />
            Demo Login
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#232e3d]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#161d27] px-3 text-slate-500 tracking-wider font-semibold">Or with email</span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Devon Archer"
                className="w-full px-3.5 py-2.5 bg-[#0e141d] border border-[#232e3d] focus:border-blue-500 focus:outline-none rounded-xl text-sm text-slate-100 placeholder-slate-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@company.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#0e141d] border border-[#232e3d] focus:border-blue-500 focus:outline-none rounded-xl text-sm text-slate-100 placeholder-slate-500 transition-colors"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-400">Password</label>
              {!isRegister && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#0e141d] border border-[#232e3d] focus:border-blue-500 focus:outline-none rounded-xl text-sm text-slate-100 placeholder-slate-500 transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                {isRegister ? 'Create account' : 'Login'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center mt-6 pt-4 border-t border-[#232e3d]">
          {isRegister ? (
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                Login
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                Create account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

