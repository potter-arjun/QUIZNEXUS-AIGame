'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AvatarSelector from './AvatarSelector';
import { Sparkles, Zap, LogIn, UserPlus, Play, Brain, Trophy, Users, Flame } from 'lucide-react';

// Seeded random-ish positions for SSR safety (no Math.random on render)
const PARTICLE_CONFIG = [
  { x: 8,  delay: 0,   dur: 9,  size: 4, col: '#a855f7' },
  { x: 15, delay: 1.5, dur: 7,  size: 3, col: '#22d3ee' },
  { x: 24, delay: 3,   dur: 11, size: 5, col: '#ec4899' },
  { x: 33, delay: 0.5, dur: 8,  size: 3, col: '#fbbf24' },
  { x: 42, delay: 4,   dur: 10, size: 6, col: '#a855f7' },
  { x: 51, delay: 2,   dur: 7,  size: 4, col: '#34d399' },
  { x: 60, delay: 5,   dur: 13, size: 3, col: '#22d3ee' },
  { x: 69, delay: 1,   dur: 9,  size: 5, col: '#ec4899' },
  { x: 78, delay: 3.5, dur: 8,  size: 4, col: '#fbbf24' },
  { x: 87, delay: 2.5, dur: 11, size: 3, col: '#a855f7' },
  { x: 12, delay: 6,   dur: 10, size: 5, col: '#34d399' },
  { x: 38, delay: 7,   dur: 7,  size: 3, col: '#22d3ee' },
  { x: 55, delay: 4.5, dur: 12, size: 4, col: '#ec4899' },
  { x: 73, delay: 1.8, dur: 9,  size: 5, col: '#a855f7' },
  { x: 92, delay: 3.2, dur: 8,  size: 3, col: '#fbbf24' },
];

const GAME_MODES = [
  { icon: Zap,    label: 'Rapid Fire',   sub: '10s timer · 2× XP',      color: 'border-rose-500/30 bg-rose-500/5',   text: 'text-rose-400'   },
  { icon: Brain,  label: 'Puzzle Quiz',  sub: '45s · Brain teasers',     color: 'border-teal-500/30 bg-teal-500/5',   text: 'text-teal-400'   },
  { icon: Trophy, label: 'Tournament',   sub: 'Bracket · Glory',         color: 'border-yellow-500/30 bg-yellow-500/5', text: 'text-yellow-400' },
  { icon: Users,  label: 'Team Battle',  sub: 'Red vs Blue · Co-op',     color: 'border-blue-500/30 bg-blue-500/5',   text: 'text-blue-400'   },
];

const STATS = [
  { value: '5',    label: 'Game Modes' },
  { value: '500+', label: 'Questions'  },
  { value: '100',  label: 'Max Players'},
  { value: 'AI',   label: 'Powered'    },
];

export const AuthView: React.FC = () => {
  const { login, register, loginAsGuest } = useAuth();
  const [activeTab, setActiveTab] = useState<'guest' | 'login' | 'register'>('guest');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarId, setAvatarId] = useState('avatar_1');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (activeTab === 'guest') await loginAsGuest(username, avatarId);
      else if (activeTab === 'login') await login(email, password);
      else await register(username, email, password, avatarId);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col lg:flex-row min-h-screen overflow-hidden" style={{ background: 'radial-gradient(ellipse at 30% 20%, #0f0828 0%, #030014 60%)' }}>

      {/* ── ANIMATED BACKGROUND ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.06) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }} />
        {/* Glow blobs */}
        <div className="absolute top-[-15%] left-[-5%] w-[55vw] h-[55vw] rounded-full" style={{ background: 'rgba(139,92,246,0.08)', filter: 'blur(120px)' }} />
        <div className="absolute bottom-[-20%] right-[-5%] w-[45vw] h-[45vw] rounded-full" style={{ background: 'rgba(34,211,238,0.07)', filter: 'blur(100px)' }} />
        <div className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] rounded-full" style={{ background: 'rgba(236,72,153,0.05)', filter: 'blur(80px)' }} />
        {/* Floating particles */}
        {PARTICLE_CONFIG.map((p, i) => (
          <div key={i} className="absolute rounded-full animate-float-particle" style={{
            left: `${p.x}%`, bottom: '-10px',
            width: p.size, height: p.size,
            backgroundColor: p.col,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }} />
        ))}
      </div>

      {/* ── LEFT HERO PANEL (desktop only) ── */}
      <div className="relative hidden lg:flex flex-col justify-center flex-1 px-14 xl:px-20 py-16 z-10">

        {/* Logo */}
        <div className="flex items-center gap-4 mb-12">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl blur-xl" style={{ background: 'rgba(139,92,246,0.5)' }} />
            <div className="relative p-3.5 rounded-2xl border-2" style={{ background: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.5)' }}>
              <Brain size={38} className="text-purple-400" />
            </div>
          </div>
          <div>
            <h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-none" style={{
              background: 'linear-gradient(135deg, #22d3ee 0%, #a855f7 50%, #ec4899 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              QUIZ NEXUS
            </h1>
            <p className="text-xs text-zinc-500 font-bold tracking-[0.3em] uppercase mt-1.5">
              AI-Powered Multiplayer Quiz Arena
            </p>
          </div>
        </div>

        {/* Hero copy */}
        <h2 className="text-3xl xl:text-4xl font-black text-zinc-100 leading-tight mb-4 max-w-lg">
          Test your mind.<br />
          <span style={{ background: 'linear-gradient(90deg,#22d3ee,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Crush the competition.
          </span>
        </h2>
        <p className="text-zinc-400 text-base max-w-md mb-10 leading-relaxed">
          Real-time AI-generated questions across 5 battle modes. Form squads, power up, climb the global leaderboard.
        </p>

        {/* Mode cards */}
        <div className="grid grid-cols-2 gap-3 mb-10 max-w-sm">
          {GAME_MODES.map(m => (
            <div key={m.label} className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${m.color}`}>
              <m.icon size={16} className={m.text} />
              <div>
                <div className={`text-xs font-black ${m.text}`}>{m.label}</div>
                <div className="text-[10px] text-zinc-600">{m.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-8">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-2xl font-black" style={{ background: 'linear-gradient(90deg,#22d3ee,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {s.value}
              </div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Decorative bottom badge */}
        <div className="absolute bottom-8 left-14 xl:left-20 flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5">
          <Flame size={12} className="text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Live multiplayer · Real-time AI</span>
        </div>
      </div>

      {/* ── RIGHT AUTH PANEL ── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-5 py-10 lg:py-0 lg:w-[460px] xl:w-[500px]"
        style={{ background: 'rgba(9,7,25,0.7)', backdropFilter: 'blur(24px)', borderLeft: '1px solid rgba(139,92,246,0.15)' }}>

        {/* Mobile header */}
        <div className="lg:hidden text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl border" style={{ background: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.4)' }}>
              <Brain size={24} className="text-purple-400" />
            </div>
            <h1 className="text-3xl font-black" style={{ background: 'linear-gradient(135deg,#22d3ee,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              QUIZ NEXUS
            </h1>
          </div>
          <p className="text-zinc-600 text-[10px] tracking-[0.25em] uppercase font-bold">AI-Powered Multiplayer Quiz Arena</p>
        </div>

        <div className="w-full max-w-[360px]">

          {/* Tab switcher */}
          <div className="flex p-1 rounded-2xl mb-6 border" style={{ background: 'rgba(24,20,48,0.8)', borderColor: 'rgba(63,54,120,0.4)' }}>
            {([
              { key: 'guest' as const,    icon: Play,     label: 'Quick Play' },
              { key: 'login' as const,    icon: LogIn,    label: 'Login'      },
              { key: 'register' as const, icon: UserPlus, label: 'Register'   },
            ]).map(t => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); }}
                className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold tracking-wide transition-all uppercase cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === t.key
                    ? 'text-white shadow-lg'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                style={activeTab === t.key ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}
              >
                <t.icon size={11} /> {t.label}
              </button>
            ))}
          </div>

          {/* Context heading */}
          <div className="mb-5">
            {activeTab === 'guest'    && <><h3 className="text-lg font-black text-zinc-100">Jump right in</h3><p className="text-xs text-zinc-500 mt-0.5">No account needed. Pick a name and start battling.</p></>}
            {activeTab === 'login'    && <><h3 className="text-lg font-black text-zinc-100">Welcome back</h3><p className="text-xs text-zinc-500 mt-0.5">Your coins, XP, and achievements are waiting.</p></>}
            {activeTab === 'register' && <><h3 className="text-lg font-black text-zinc-100">Join the arena</h3><p className="text-xs text-zinc-500 mt-0.5">Save progress, earn rewards, top the leaderboard.</p></>}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl text-xs text-center mb-4 border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab !== 'login' && (
              <div>
                <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase block mb-1.5">Nickname</label>
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. NeuroHunter" required
                  className="w-full px-4 py-3 rounded-xl text-zinc-200 placeholder-zinc-600 transition-all outline-none"
                  style={{ background: 'rgba(24,20,48,0.8)', border: '1px solid rgba(63,54,120,0.5)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.7)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(63,54,120,0.5)')}
                />
              </div>
            )}
            {activeTab !== 'guest' && (
              <div>
                <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase block mb-1.5">Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className="w-full px-4 py-3 rounded-xl text-zinc-200 placeholder-zinc-600 transition-all outline-none"
                  style={{ background: 'rgba(24,20,48,0.8)', border: '1px solid rgba(63,54,120,0.5)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.7)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(63,54,120,0.5)')}
                />
              </div>
            )}
            {activeTab !== 'guest' && (
              <div>
                <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase block mb-1.5">Password</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full px-4 py-3 rounded-xl text-zinc-200 placeholder-zinc-600 transition-all outline-none"
                  style={{ background: 'rgba(24,20,48,0.8)', border: '1px solid rgba(63,54,120,0.5)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.7)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(63,54,120,0.5)')}
                />
              </div>
            )}
            {activeTab !== 'login' && (
              <div>
                <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase block mb-2 text-center">Choose Your Avatar</label>
                <AvatarSelector selectedId={avatarId} onSelect={setAvatarId} />
              </div>
            )}

            {/* CTA button */}
            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-black text-sm text-white shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer uppercase tracking-widest mt-2"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', boxShadow: '0 8px 32px rgba(124,58,237,0.3)' }}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : activeTab === 'guest' ? (
                <><Zap size={16} className="text-yellow-300" /> Enter the Arena</>
              ) : activeTab === 'login' ? (
                <><LogIn size={16} /> Continue Battle</>
              ) : (
                <><Sparkles size={16} /> Create & Play</>
              )}
            </button>
          </form>

          {/* Mobile stats */}
          <div className="lg:hidden flex items-center justify-center gap-6 mt-8 pt-6" style={{ borderTop: '1px solid rgba(63,54,120,0.3)' }}>
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-base font-black" style={{ background: 'linear-gradient(90deg,#22d3ee,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
                <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
