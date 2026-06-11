'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, Brain, KeyRound } from 'lucide-react';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError('Missing or invalid reset link.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed.');
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-5" style={{ background: 'radial-gradient(ellipse at 30% 20%, #0f0828 0%, #030014 60%)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(139,92,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.06) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
      }} />

      <div className="relative z-10 w-full max-w-[380px] rounded-2xl p-8 border" style={{ background: 'rgba(9,7,25,0.85)', backdropFilter: 'blur(24px)', borderColor: 'rgba(139,92,246,0.2)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl border" style={{ background: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.4)' }}>
            <Brain size={20} className="text-purple-400" />
          </div>
          <span className="font-black text-lg" style={{ background: 'linear-gradient(135deg,#22d3ee,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            QUIZ NEXUS
          </span>
        </div>

        {done ? (
          <div className="text-center space-y-4 py-4">
            <div className="text-4xl">✅</div>
            <p className="text-zinc-200 font-black text-base">Password updated!</p>
            <p className="text-zinc-500 text-xs">You can now log in with your new password.</p>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 rounded-xl font-black text-sm text-white mt-2 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound size={16} className="text-purple-400" />
                <h2 className="text-base font-black text-zinc-100">Set new password</h2>
              </div>
              <p className="text-xs text-zinc-500">Choose a strong password for your account.</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl text-xs text-center mb-4 border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase block mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required minLength={6}
                    className="w-full px-4 py-3 pr-11 rounded-xl text-zinc-200 placeholder-zinc-600 transition-all outline-none"
                    style={{ background: 'rgba(24,20,48,0.8)', border: '1px solid rgba(63,54,120,0.5)' }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.7)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(63,54,120,0.5)')}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase block mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••" required
                    className="w-full px-4 py-3 pr-11 rounded-xl text-zinc-200 placeholder-zinc-600 transition-all outline-none"
                    style={{ background: 'rgba(24,20,48,0.8)', border: '1px solid rgba(63,54,120,0.5)' }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.7)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(63,54,120,0.5)')}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={loading || !token}
                className="w-full py-3.5 rounded-xl font-black text-sm text-white shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer uppercase tracking-widest mt-2"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', boxShadow: '0 8px 32px rgba(124,58,237,0.3)' }}
              >
                {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
