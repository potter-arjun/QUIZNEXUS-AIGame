'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getAvatarSvg } from '../utils/avatars';
import {
  Trophy, Award, Users, ShieldAlert, Sparkles, Coins,
  Gamepad2, PlusCircle, ArrowRight, RefreshCw, LogOut,
  Trash2, Flame, Zap, Star, Target, Calendar
} from 'lucide-react';
import { DailyChallengeView } from './DailyChallengeView';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

// Animated number counter
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = target / (duration / 16);
    const interval = setInterval(() => {
      start = Math.min(start + step, target);
      setValue(Math.floor(start));
      if (start >= target) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [target, duration]);
  return value;
}

// Daily login streak (localStorage)
function useDailyStreak() {
  const [streak, setStreak] = useState(0);
  const [isNew, setIsNew] = useState(false);
  useEffect(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const last = localStorage.getItem('qb_last_date');
    const saved = parseInt(localStorage.getItem('qb_streak') || '0');
    if (last === today) {
      setStreak(saved);
    } else if (last === yesterday) {
      const next = saved + 1;
      localStorage.setItem('qb_streak', String(next));
      localStorage.setItem('qb_last_date', today);
      setStreak(next);
      setIsNew(true);
    } else {
      localStorage.setItem('qb_streak', '1');
      localStorage.setItem('qb_last_date', today);
      setStreak(1);
      setIsNew(last !== null);
    }
  }, []);
  return { streak, isNew };
}

const MODE_CONFIG = {
  classic:      { label: 'CLASSIC BATTLE',   color: 'cyan',   glow: 'rgba(34,211,238,0.35)',  desc: 'Traditional 2-100 player match. Fixed questions, structured scoring.',     badge: null },
  rapid:        { label: 'RAPID FIRE',        color: 'rose',   glow: 'rgba(244,63,94,0.35)',   desc: '10-second timers. Double coins & XP. Blink and you lose.',                 badge: '2x XP' },
  team:         { label: 'TEAM BATTLE',       color: 'amber',  glow: 'rgba(245,158,11,0.35)',  desc: 'Red vs Blue. Pool your squad scores. Only the best team wins.',             badge: null },
  classroom:    { label: 'CLASSROOM MODE',    color: 'emerald',glow: 'rgba(52,211,153,0.35)',  desc: 'Instructor-led sessions. Real-time student monitoring and control.',        badge: 'EDU' },
  puzzle:       { label: 'PUZZLE QUIZ',       color: 'teal',   glow: 'rgba(20,184,166,0.35)',  desc: 'Brain teasers, riddles, sequences & logic puzzles. Deeper thinking, 45 seconds per question.', badge: '🧩' },
  battle_royale:{ label: 'BATTLE ROYALE',     color: 'red',    glow: 'rgba(239,68,68,0.35)',   desc: '3 lives each. Wrong answer = lose a life. Last player standing wins. No mercy.', badge: '💀' },
} as const;

export const DashboardView: React.FC = () => {
  const { user, token, logout, updateLocalUser } = useAuth();
  const { createRoom, joinRoom, publicRooms, refreshPublicRooms } = useSocket();

  const [activeTab, setActiveTab] = useState<'arena' | 'leaderboard' | 'achievements' | 'shop' | 'mindrank' | 'admin' | 'daily'>('arena');
  const [joinCode, setJoinCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomMode, setRoomMode] = useState<'classic' | 'rapid' | 'team' | 'classroom' | 'puzzle' | 'battle_royale'>('classic');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [language, setLanguage] = useState<'en' | 'hi' | 'bilingual'>('en');
  const [questionsCount, setQuestionsCount] = useState(10);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [isPrivate, setIsPrivate] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<{ topCoins: any[]; topWins: any[] }>({ topCoins: [], topWins: [] });
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  const { streak, isNew: isNewStreak } = useDailyStreak();
  const animatedCoins = useCountUp(user?.coins ?? 0);

  // Power-up inventory (localStorage)
  const [inventory, setInventory] = useState<{ fiftyFifty: number; doublePoints: number }>(() => {
    if (typeof window === 'undefined') return { fiftyFifty: 0, doublePoints: 0 };
    try { return JSON.parse(localStorage.getItem('qb_inventory') || '{}'); } catch { return {}; }
  });
  const [buyingItem, setBuyingItem] = useState<string | null>(null);
  const [buyMsg, setBuyMsg] = useState<string | null>(null);

  const inventoryOf = (key: keyof typeof inventory) => inventory[key] ?? 0;

  const buyPowerup = async (itemKey: 'fiftyFifty' | 'doublePoints', cost: number, label: string) => {
    if (!user || !token || user.coins < cost) return;
    setBuyingItem(itemKey);
    try {
      const res = await fetch(`${SERVER_URL}/api/user/spend-coins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: cost })
      });
      const data = await res.json();
      if (!res.ok) { setBuyMsg(data.error || 'Purchase failed'); return; }
      updateLocalUser(data.user);
      const next = { ...inventory, [itemKey]: inventoryOf(itemKey) + 1 };
      setInventory(next);
      localStorage.setItem('qb_inventory', JSON.stringify(next));
      setBuyMsg(`✓ ${label} added to your inventory!`);
    } catch { setBuyMsg('Network error'); }
    finally { setBuyingItem(null); setTimeout(() => setBuyMsg(null), 3000); }
  };

  const nextLevelXp = 100;
  const currentXpInLevel = (user?.xp ?? 0) % 100;
  const progressPercentage = Math.min((currentXpInLevel / nextLevelXp) * 100, 100);
  const xpToNextLevel = nextLevelXp - currentXpInLevel;

  const onlinePlayers = publicRooms.reduce((s, r) => s + Object.keys(r.players).length, 0);

  // Mind Rank state
  const [mindProfile, setMindProfile] = useState<any>(null);
  const [mindLeaderboard, setMindLeaderboard] = useState<any[]>([]);
  const [mindLoading, setMindLoading] = useState(false);
  const [mindLbLoading, setMindLbLoading] = useState(false);
  const animatedMCS = useCountUp(mindProfile?.mcs ?? 0, 1200);

  const fetchMindProfile = () => {
    if (!token) return;
    setMindLoading(true);
    fetch(`${SERVER_URL}/api/user/mind-profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.tier) setMindProfile(d); }).catch(() => {}).finally(() => setMindLoading(false));
  };
  const fetchMindLeaderboard = () => {
    setMindLbLoading(true);
    fetch(`${SERVER_URL}/api/user/mind-leaderboard`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setMindLeaderboard(d); }).catch(() => {}).finally(() => setMindLbLoading(false));
  };

  useEffect(() => { refreshPublicRooms(); }, [refreshPublicRooms]);

  useEffect(() => {
    if (activeTab !== 'mindrank') return;
    if (!mindProfile) fetchMindProfile();
    if (!mindLeaderboard.length) fetchMindLeaderboard();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'leaderboard') return;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch(`${SERVER_URL}/api/user/leaderboard`, { headers })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d?.topCoins)) setLeaderboardData(d); })
      .catch(() => {});
  }, [activeTab, token]);

  useEffect(() => {
    if (activeTab !== 'admin') return;
    fetch(`${SERVER_URL}/api/admin/stats`).then(r => r.json()).then(setAdminStats).catch(() => {});
    fetch(`${SERVER_URL}/api/admin/users`).then(r => r.json()).then(setAdminUsers).catch(() => {});
  }, [activeTab]);

  const handleCreateRoom = (e: { preventDefault(): void }) => {
    e.preventDefault();
    createRoom({ mode: roomMode, difficulty, language, questionCount: Number(questionsCount), maxPlayers: Number(maxPlayers), isPrivate, customTopic: customTopic.trim() || undefined });
    setCustomTopic('');
    setShowCreateModal(false);
  };

  const handleJoinByCode = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    joinRoom(joinCode.trim());
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user?')) return;
    const res = await fetch(`${SERVER_URL}/api/admin/users/${userId}`, { method: 'DELETE' });
    if (res.ok) {
      setAdminUsers(p => p.filter(u => u.id !== userId));
      fetch(`${SERVER_URL}/api/admin/stats`).then(r => r.json()).then(setAdminStats).catch(() => {});
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* ── Profile Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-3xl border border-purple-500/20 bg-zinc-950/40 backdrop-blur-md mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              dangerouslySetInnerHTML={{ __html: getAvatarSvg(user.avatarUrl, 54) }}
              className="w-14 h-14 rounded-2xl bg-zinc-900 border border-purple-500/30 p-1"
            />
            {/* Level badge */}
            <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 text-[9px] font-black bg-purple-600 text-white rounded-md shadow-lg">
              LVL {user.level}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-extrabold text-zinc-100">{user.username}</span>
              {/* Daily streak badge */}
              {streak >= 2 && (
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-500/15 border border-orange-500/25 ${isNewStreak ? 'animate-heartbeat' : ''}`}>
                  <Flame size={11} className="text-orange-400 animate-streak-glow" fill="#f97316" />
                  <span className="text-[10px] font-black text-orange-400">{streak} DAY STREAK</span>
                </div>
              )}
            </div>
            {/* XP bar with animated fill */}
            <div className="flex items-center gap-2 w-[220px]">
              <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-fill-bar"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-400 font-bold whitespace-nowrap">{currentXpInLevel}/100 XP</span>
            </div>
            <span className="text-[10px] text-zinc-600 font-medium">{xpToNextLevel} XP to Level {user.level + 1}</span>
          </div>
        </div>

        {/* Stats + Logout */}
        <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-zinc-900 pt-3 md:pt-0">
          <div className="flex items-center gap-3">
            {/* Animated coins */}
            <div className="flex items-center gap-1.5 bg-yellow-500/10 px-3 py-2 rounded-xl border border-yellow-500/20 text-yellow-500 font-extrabold text-sm">
              <Coins size={16} />
              <span key={animatedCoins} className="animate-count-up">{animatedCoins}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-purple-500/10 px-3 py-2 rounded-xl border border-purple-500/20 text-purple-400 font-extrabold text-sm">
              <Trophy size={16} />
              <span>{user.wins} Wins</span>
            </div>
          </div>
          <button onClick={logout} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-rose-500/40 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-all cursor-pointer" title="Log Out">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* ── Streak welcome (first day / new streak) ── */}
      {isNewStreak && streak >= 2 && (
        <div className="mb-5 px-5 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-3 animate-fade-in-up">
          <Flame size={20} className="text-orange-400" fill="#f97316" />
          <div>
            <p className="text-sm font-black text-orange-300">🎉 {streak}-Day Streak! Keep the fire going!</p>
            <p className="text-xs text-zinc-500">Play again tomorrow to extend your streak and earn bonus coins.</p>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-zinc-900">
        {([
          { key: 'arena',        label: 'Battle Arena',   icon: Gamepad2    },
          { key: 'daily',        label: 'Daily Challenge',icon: Calendar    },
          { key: 'leaderboard',  label: 'Leaderboards',   icon: Trophy      },
          { key: 'achievements', label: 'Achievements',   icon: Award       },
          { key: 'shop',         label: 'Power-Up Shop',  icon: Coins       },
          { key: 'mindrank',     label: '🧠 Mind Rank',   icon: Sparkles    },
          { key: 'admin',        label: 'Admin Console',  icon: ShieldAlert },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border whitespace-nowrap ${
              activeTab === t.key
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                : 'bg-zinc-950/20 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── ARENA TAB ── */}
      {activeTab === 'arena' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
          <div className="lg:col-span-2 space-y-8">

            {/* Quick Play CTA */}
            <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/60 to-indigo-950/40 p-6">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)] pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">
                    {onlinePlayers > 0 ? `⚡ ${onlinePlayers} players in active rooms` : '⚡ Be the first to battle'}
                  </p>
                  <h2 className="text-xl font-black text-zinc-100 tracking-tight">Ready to Battle?</h2>
                  <p className="text-xs text-zinc-400 mt-1">Pick a mode below or join an open lobby.</p>
                </div>
                <button
                  onClick={() => { setRoomMode('classic'); setShowCreateModal(true); }}
                  className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all active:scale-95 animate-neon-pulse whitespace-nowrap"
                >
                  <Zap size={16} fill="currentColor" /> Quick Battle
                </button>
              </div>
            </div>

            {/* Join by code */}
            <div className="glass-panel p-6 rounded-3xl bg-zinc-950/30">
              <h2 className="text-sm font-bold tracking-wider mb-4 flex items-center gap-2 text-zinc-400 uppercase">
                <Users size={15} className="text-purple-400" /> Join with Room Code
              </h2>
              <form onSubmit={handleJoinByCode} className="flex gap-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ENTER 6-DIGIT CODE"
                  maxLength={6}
                  className="flex-1 px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:outline-none focus:border-purple-500 font-mono text-center text-lg tracking-widest text-zinc-200 placeholder-zinc-600 uppercase transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                >
                  Join <ArrowRight size={14} />
                </button>
              </form>
            </div>

            {/* Mode cards */}
            <div>
              <h2 className="text-sm font-bold tracking-wider mb-5 flex items-center gap-2 text-zinc-400 uppercase">
                <Gamepad2 size={15} className="text-purple-400" /> Select Battle Mode
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(Object.entries(MODE_CONFIG) as [keyof typeof MODE_CONFIG, typeof MODE_CONFIG[keyof typeof MODE_CONFIG]][]).map(([key, cfg]) => (
                  <div
                    key={key}
                    onClick={() => { setRoomMode(key); setShowCreateModal(true); }}
                    onMouseEnter={() => setHoveredMode(key)}
                    onMouseLeave={() => setHoveredMode(null)}
                    className="glass-panel p-5 rounded-2xl cursor-pointer bg-zinc-950/20 group transition-all duration-300 relative overflow-hidden"
                    style={{
                      boxShadow: hoveredMode === key ? `0 0 0 1px ${cfg.glow}, 0 8px 32px ${cfg.glow}` : undefined,
                      borderColor: hoveredMode === key ? cfg.glow : undefined,
                    }}
                  >
                    {/* Badge */}
                    {cfg.badge && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 text-[9px] font-black bg-rose-500 text-white rounded-md uppercase tracking-wide">
                        {cfg.badge}
                      </span>
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border transition-all group-hover:scale-110 bg-${cfg.color}-500/10 border-${cfg.color}-500/20 text-${cfg.color}-400`}>
                      {key === 'classic'       && <Gamepad2 size={20} />}
                      {key === 'rapid'         && <Zap size={20} />}
                      {key === 'team'          && <Users size={20} />}
                      {key === 'classroom'     && <Star size={20} />}
                      {key === 'puzzle'        && <span className="text-xl">🧩</span>}
                      {key === 'battle_royale' && <span className="text-xl">💀</span>}
                    </div>
                    <h3 className={`font-extrabold text-sm text-zinc-200 uppercase tracking-wide transition-colors group-hover:text-${cfg.color}-400`}>
                      {cfg.label}
                    </h3>
                    <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed">{cfg.desc}</p>
                    <div className={`mt-3 flex items-center gap-1 text-[10px] font-bold text-${cfg.color}-500 opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <span>START NOW</span> <ArrowRight size={10} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Public Lobbies */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl bg-zinc-950/30 flex flex-col h-[500px]">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                <div>
                  <h2 className="text-sm font-bold tracking-wider text-zinc-400 uppercase">Open Lobbies</h2>
                  {publicRooms.length > 0 && (
                    <p className="text-[10px] text-emerald-400 font-bold mt-0.5">● {publicRooms.length} active</p>
                  )}
                </div>
                <button onClick={refreshPublicRooms} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer" title="Refresh">
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3">
                {publicRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <Gamepad2 size={32} className="text-zinc-700" />
                    <p className="text-xs text-zinc-600 font-medium">No open rooms yet.<br/>Create one and invite friends!</p>
                  </div>
                ) : (
                  publicRooms.map(room => {
                    const count = Object.keys(room.players).length;
                    const isFull = count >= room.maxPlayers;
                    return (
                      <div
                        key={room.code}
                        className="p-3.5 rounded-xl border border-zinc-900 bg-zinc-950/80 hover:border-purple-500/40 hover:bg-purple-500/5 flex items-center justify-between transition-all group"
                      >
                        <div className="flex flex-col">
                          <span className="font-mono font-black text-sm text-purple-400 tracking-wider">{room.code}</span>
                          <span className="text-[10px] text-zinc-500 uppercase font-semibold mt-0.5">
                            {room.mode} • {room.difficulty} • {room.language}
                          </span>
                          {room.customTopic && (
                            <span className="text-[10px] text-cyan-400 font-bold mt-0.5">📌 {room.customTopic}</span>
                          )}
                        </div>
                        <button
                          onClick={() => !isFull && joinRoom(room.code)}
                          disabled={isFull}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all cursor-pointer ${
                            isFull
                              ? 'border-zinc-800 text-zinc-600 bg-zinc-900/20 cursor-not-allowed'
                              : 'bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600 hover:text-white'
                          }`}
                        >
                          {isFull ? 'FULL' : `Join (${count}/${room.maxPlayers})`}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LEADERBOARD TAB ── */}
      {activeTab === 'leaderboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
          {([
            { title: 'Top Coin Collectors', key: 'topCoins', icon: Coins, statKey: 'coins', unit: 'coins', color: 'text-yellow-500' },
            { title: 'Top Champions',       key: 'topWins',  icon: Trophy, statKey: 'wins',  unit: 'Wins',  color: 'text-purple-400' },
          ] as const).map(({ title, key, icon: Icon, statKey, unit, color }) => (
            <div key={key} className="glass-panel p-6 rounded-3xl bg-zinc-950/20">
              <h3 className="text-base font-bold tracking-tight mb-5 flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Icon className={color} size={18} /> {title}
              </h3>
              <div className="space-y-3">
                {leaderboardData[key].map((p: any, idx: number) => (
                  <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    p.id === user.id ? 'bg-purple-500/10 border-purple-500/20' : 'bg-zinc-950/60 border-zinc-900'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-black w-6 text-center ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-amber-700' : 'text-zinc-600'}`}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                      </span>
                      <div dangerouslySetInnerHTML={{ __html: getAvatarSvg(p.avatarUrl, 32) }} className="w-8 h-8 rounded-full bg-zinc-800" />
                      <span className="text-sm font-semibold text-zinc-200">{p.username}</span>
                      {p.id === user.id && <span className="text-[9px] font-black text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">YOU</span>}
                    </div>
                    <span className={`text-sm font-extrabold ${color}`}>{p[statKey]} {unit}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ACHIEVEMENTS TAB ── */}
      {activeTab === 'achievements' && (
        <div className="glass-panel p-6 rounded-3xl bg-zinc-950/20 animate-fade-in-up">
          <h3 className="text-base font-bold tracking-tight mb-6 border-b border-zinc-900 pb-3 flex items-center gap-2">
            <Award className="text-purple-400" size={18} /> Achievement Badges
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { type: 'FIRST_WIN',        name: 'First Victory',     desc: 'Win your first match',              icon: Trophy,    gradient: 'from-yellow-400 to-amber-500',  progress: Math.min(user.wins, 1),   max: 1   },
              { type: 'TEN_WINS',         name: 'Gladiator',         desc: 'Win 10 matches',                    icon: Trophy,    gradient: 'from-purple-400 to-indigo-500', progress: Math.min(user.wins, 10),  max: 10  },
              { type: 'HUNDRED_WINS',     name: 'Quiz Overlord',     desc: 'Win 100 matches',                   icon: Trophy,    gradient: 'from-rose-400 to-pink-500',     progress: Math.min(user.wins, 100), max: 100 },
              { type: 'FASTEST_FINGER',   name: 'Speed Demon',       desc: 'Avg response < 1.8s in a match',   icon: Zap,       gradient: 'from-cyan-400 to-blue-500',     progress: 0,                        max: 1   },
              { type: 'PERFECT_ACCURACY', name: 'Perfect Marksman',  desc: '100% accuracy in a match',         icon: Target,    gradient: 'from-emerald-400 to-green-500', progress: 0,                        max: 1   },
              { type: 'QUIZ_MASTER',      name: 'Quiz Guru',         desc: 'Reach Level 10',                   icon: Sparkles,  gradient: 'from-orange-400 to-rose-500',   progress: Math.min(user.level, 10), max: 10  },
            ].map(ach => {
              const isUnlocked = ach.progress >= ach.max;
              const pct = Math.round((ach.progress / ach.max) * 100);
              return (
                <div
                  key={ach.type}
                  className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                    isUnlocked
                      ? 'bg-zinc-950/80 border-purple-500/40 shadow-lg shadow-purple-500/5'
                      : 'bg-zinc-950/20 border-zinc-900'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ach.gradient} flex items-center justify-center text-zinc-950 shrink-0 shadow-lg ${!isUnlocked ? 'opacity-40 grayscale' : ''}`}>
                    <ach.icon size={22} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-sm text-zinc-200 truncate">{ach.name}</span>
                      {isUnlocked && <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">✓ DONE</span>}
                    </div>
                    <span className="text-zinc-500 text-[11px] mt-0.5">{ach.desc}</span>
                    {/* Progress bar for locked achievements */}
                    {!isUnlocked && ach.max > 1 && (
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[9px] text-zinc-600 font-bold mb-1">
                          <span>{ach.progress}/{ach.max}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${ach.gradient} rounded-full animate-fill-bar`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {!isUnlocked && ach.max === 1 && (
                      <span className="text-[9px] font-bold text-zinc-600 mt-1.5 uppercase tracking-wide">🔒 Locked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SHOP TAB ── */}
      {activeTab === 'shop' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight text-zinc-100">🛒 Power-Up Shop</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Spend your coins to gain advantages in battle</p>
            </div>
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl px-5 py-2.5">
              <Coins size={18} className="text-yellow-400" />
              <span className="text-xl font-black text-yellow-300">{user.coins}</span>
              <span className="text-xs text-zinc-500 font-medium">coins</span>
            </div>
          </div>

          {/* Feedback message */}
          {buyMsg && (
            <div className={`px-4 py-3 rounded-xl text-sm font-semibold border ${
              buyMsg.startsWith('✓')
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {buyMsg}
            </div>
          )}

          {/* Shop items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {([
              {
                key: 'fiftyFifty' as const,
                icon: '✂️',
                name: '50/50 Lifeline',
                desc: 'Eliminates 2 wrong answers from the board. Use it when you\'re stuck.',
                cost: 15,
                color: 'yellow',
                border: 'border-yellow-500/20',
                bg: 'bg-yellow-500/5',
                badge: 'bg-yellow-500/20 text-yellow-300',
                btnColor: 'bg-yellow-500 hover:bg-yellow-400 text-zinc-950',
              },
              {
                key: 'doublePoints' as const,
                icon: '⚡',
                name: 'Double Points',
                desc: 'Your next correct answer earns 2× points. Activate before answering.',
                cost: 25,
                color: 'purple',
                border: 'border-purple-500/20',
                bg: 'bg-purple-500/5',
                badge: 'bg-purple-500/20 text-purple-300',
                btnColor: 'bg-purple-500 hover:bg-purple-400 text-white',
              },
            ] as const).map(item => {
              const stock = inventoryOf(item.key);
              const canAfford = user.coins >= item.cost;
              const isBuying = buyingItem === item.key;
              return (
                <div key={item.key} className={`rounded-2xl border ${item.border} ${item.bg} p-6 flex flex-col gap-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{item.icon}</span>
                      <div>
                        <h3 className="font-black text-sm text-zinc-100">{item.name}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5 max-w-[200px]">{item.desc}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-black px-2 py-1 rounded-lg shrink-0 ${item.badge}`}>
                      {stock} in stock
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-800">
                    <div className="flex items-center gap-1.5">
                      <Coins size={14} className="text-yellow-400" />
                      <span className="text-base font-black text-yellow-300">{item.cost}</span>
                      <span className="text-xs text-zinc-500">coins each</span>
                    </div>
                    <button
                      onClick={() => buyPowerup(item.key, item.cost, item.name)}
                      disabled={!canAfford || isBuying}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                        canAfford && !isBuying
                          ? `${item.btnColor} active:scale-95 shadow-lg`
                          : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      {isBuying ? 'Buying…' : canAfford ? `Buy — ${item.cost} 🪙` : 'Not enough coins'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* How to earn more coins */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-5">
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">How to earn coins</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Complete a match', coins: '+10' },
                { label: '🥇 First place',   coins: '+50' },
                { label: '🥈 Second place',  coins: '+25' },
                { label: '🥉 Third place',   coins: '+15' },
              ].map(r => (
                <div key={r.label} className="flex flex-col items-center gap-1 bg-zinc-900/50 rounded-xl p-3">
                  <span className="text-yellow-400 font-black text-base">{r.coins}</span>
                  <span className="text-zinc-500 text-[10px] text-center font-medium">{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MIND RANK TAB ── */}
      {activeTab === 'mindrank' && (
        <div className="space-y-6 animate-fade-in-up">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight text-zinc-100">🧠 Mind Capability Score</h2>
              <p className="text-xs text-zinc-500 mt-0.5">AI-powered cognitive analysis based on your battle performance</p>
            </div>
            <button
              onClick={() => { setMindProfile(null); fetchMindProfile(); fetchMindLeaderboard(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all cursor-pointer"
            >
              <RefreshCw size={12} className={mindLoading ? 'animate-spin' : ''} /> Refresh Analysis
            </button>
          </div>

          {mindLoading && !mindProfile ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
              <p className="text-xs text-zinc-500 font-bold tracking-widest uppercase animate-pulse">AI is analysing your mind…</p>
            </div>
          ) : mindProfile ? (
            <>
              {/* Hero row: MCS card + Archetype + AI Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* MCS Score card */}
                <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/60 to-indigo-950/40 p-6 flex flex-col items-center justify-center gap-2 text-center">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.15),transparent_70%)] pointer-events-none" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Mind Capability Score</span>
                  <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-300 leading-none">
                    {animatedMCS}
                  </div>
                  <span className="text-[10px] text-zinc-500">out of 1000</span>
                  {/* Tier badge */}
                  {(() => {
                    const TIER_STYLES: Record<string, string> = {
                      GRANDMASTER: 'from-amber-400 to-orange-500',
                      GENIUS:      'from-purple-400 to-pink-500',
                      EXPERT:      'from-cyan-400 to-blue-500',
                      SCHOLAR:     'from-emerald-400 to-teal-500',
                      CHALLENGER:  'from-rose-400 to-red-500',
                      APPRENTICE:  'from-zinc-400 to-slate-500',
                      ROOKIE:      'from-zinc-600 to-zinc-700',
                    };
                    const TIER_CROWN: Record<string, string> = {
                      GRANDMASTER: '👑', GENIUS: '🧠', EXPERT: '⚡',
                      SCHOLAR: '📚', CHALLENGER: '🔥', APPRENTICE: '⚔️', ROOKIE: '🌱'
                    };
                    const g = TIER_STYLES[mindProfile.tier] || TIER_STYLES.ROOKIE;
                    return (
                      <div className={`mt-1 px-5 py-1.5 rounded-full bg-gradient-to-r ${g} text-zinc-950 text-xs font-black uppercase tracking-widest shadow-lg`}>
                        {TIER_CROWN[mindProfile.tier]} {mindProfile.tier}
                      </div>
                    );
                  })()}
                  {/* Progress to next tier */}
                  {mindProfile.tierNext && (
                    <div className="w-full mt-3 px-2">
                      <div className="flex justify-between text-[9px] text-zinc-600 font-bold mb-1">
                        <span>{mindProfile.tier}</span>
                        <span>{mindProfile.tierNext} at {mindProfile.tierNextAt}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min(100, ((mindProfile.mcs - (mindProfile.tierNextAt - 150)) / 150) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Archetype card */}
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6 flex flex-col gap-3">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cognitive Archetype</span>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{mindProfile.archetypeEmoji}</span>
                    <div>
                      <div className="text-base font-black text-zinc-100">{mindProfile.archetype}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{mindProfile.archetypeDesc}</div>
                    </div>
                  </div>
                  <div className="mt-auto pt-3 border-t border-zinc-900 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-sm font-black text-cyan-400">{mindProfile.breakdown.accuracy}%</div>
                      <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-wide">Accuracy</div>
                    </div>
                    <div>
                      <div className="text-sm font-black text-emerald-400">{mindProfile.breakdown.speed}s</div>
                      <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-wide">Avg Speed</div>
                    </div>
                    <div>
                      <div className="text-sm font-black text-yellow-400">{mindProfile.breakdown.winRate}%</div>
                      <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-wide">Win Rate</div>
                    </div>
                  </div>
                  {mindProfile.improving && (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                      <Sparkles size={10} /> Improving trend detected!
                    </div>
                  )}
                </div>

                {/* AI Analysis card */}
                <div className="rounded-3xl border border-cyan-500/15 bg-gradient-to-br from-cyan-950/30 to-zinc-950/40 p-6 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-cyan-500/80 uppercase tracking-widest">AI Analysis</span>
                    <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold">Gemini</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed italic flex-1">
                    "{mindProfile.analysis}"
                  </p>
                  <div className="text-[10px] text-zinc-600 font-medium pt-2 border-t border-zinc-900">
                    Based on {mindProfile.totalMatches} matches · Favorite: {mindProfile.favoriteMode}
                  </div>
                </div>
              </div>

              {/* Performance Breakdown bars */}
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-6">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-5">Performance Breakdown</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Accuracy',    value: mindProfile.breakdown.accuracy,    max: 100,  unit: '%',  color: 'from-cyan-500 to-cyan-400',    desc: 'How often you answer correctly' },
                    { label: 'Speed',       value: Math.max(0, 100 - (mindProfile.breakdown.speed / 5) * 100), max: 100, unit: '', rawVal: `${mindProfile.breakdown.speed}s avg`, color: 'from-emerald-500 to-emerald-400', desc: 'Reaction speed score (lower time = higher)' },
                    { label: 'Win Rate',    value: mindProfile.breakdown.winRate,      max: 100,  unit: '%',  color: 'from-yellow-500 to-amber-400',  desc: 'Percentage of matches won (1st place)' },
                    { label: 'Consistency', value: mindProfile.breakdown.consistency,  max: 100,  unit: '%',  color: 'from-purple-500 to-pink-400',   desc: 'How steady your accuracy is across matches' },
                    { label: 'Activity',    value: Math.min(mindProfile.breakdown.activity, 50), max: 50, unit: '', rawVal: `${mindProfile.breakdown.activity} matches`, color: 'from-rose-500 to-rose-400', desc: 'Total matches (caps at 50 for score)' },
                  ].map(row => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <span className="text-xs font-bold text-zinc-300">{row.label}</span>
                          <span className="text-[10px] text-zinc-600 ml-2">{row.desc}</span>
                        </div>
                        <span className="text-xs font-black text-zinc-300">{'rawVal' in row ? row.rawVal : `${row.value}${row.unit}`}</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${row.color} rounded-full animate-fill-bar`}
                          style={{ width: `${(row.value / row.max) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Global Mind Leaderboard */}
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-6">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Trophy size={13} className="text-yellow-400" /> Global Mind Leaderboard
                  {mindLbLoading && <span className="w-3 h-3 border border-zinc-600 border-t-transparent rounded-full animate-spin" />}
                </h3>
                <div className="space-y-2">
                  {mindLeaderboard.slice(0, 10).map((entry, idx) => {
                    const TIER_COLORS: Record<string, string> = {
                      GRANDMASTER: 'text-amber-400', GENIUS: 'text-purple-400', EXPERT: 'text-cyan-400',
                      SCHOLAR: 'text-emerald-400',   CHALLENGER: 'text-rose-400', APPRENTICE: 'text-zinc-400', ROOKIE: 'text-zinc-500'
                    };
                    const TIER_EMOJI: Record<string, string> = {
                      GRANDMASTER: '👑', GENIUS: '🧠', EXPERT: '⚡', SCHOLAR: '📚', CHALLENGER: '🔥', APPRENTICE: '⚔️', ROOKIE: '🌱'
                    };
                    const isMe = entry.username === user.username;
                    return (
                      <div key={entry.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isMe ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-zinc-900/30 border border-transparent hover:border-zinc-800'}`}>
                        <span className="text-xs font-black text-zinc-500 w-5 text-center">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </span>
                        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-zinc-700"
                          dangerouslySetInnerHTML={{ __html: getAvatarSvg(entry.avatarUrl) }} />
                        <span className={`text-xs font-bold flex-1 truncate ${isMe ? 'text-purple-300' : 'text-zinc-200'}`}>
                          {entry.username}{isMe && ' (you)'}
                        </span>
                        <span className={`text-[10px] font-black ${TIER_COLORS[entry.tier] || 'text-zinc-500'}`}>
                          {TIER_EMOJI[entry.tier]} {entry.tier}
                        </span>
                        <span className="text-sm font-black text-zinc-100 w-12 text-right">{entry.mcs}</span>
                      </div>
                    );
                  })}
                  {mindLeaderboard.length === 0 && !mindLbLoading && (
                    <p className="text-center text-zinc-600 text-xs py-6">No rankings yet — play more matches!</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-zinc-600">
              <p className="text-sm">Could not load mind profile. Check your connection.</p>
            </div>
          )}
        </div>
      )}

      {/* ── DAILY CHALLENGE TAB ── */}
      {activeTab === 'daily' && <DailyChallengeView />}

      {/* ── ADMIN TAB ── */}
      {activeTab === 'admin' && (
        <div className="space-y-8 animate-fade-in-up">
          {adminStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Registered Accounts', value: adminStats.usersCount,     color: 'text-purple-400' },
                { label: 'Completed Matches',    value: adminStats.matchesCount,   color: 'text-cyan-400'   },
                { label: 'Global Accuracy',      value: `${Math.round(adminStats.averageAccuracy)}%`, color: 'text-emerald-400' },
                { label: 'Active Lobbies',       value: adminStats.activeRoomsCount, color: 'text-yellow-500' },
              ].map(s => (
                <div key={s.label} className="glass-panel p-5 rounded-2xl bg-zinc-950/30">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">{s.label}</span>
                  <span className={`text-2xl font-black ${s.color} mt-2 block`}>{s.value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="glass-panel p-6 rounded-3xl bg-zinc-950/20">
            <h3 className="text-sm font-bold tracking-tight mb-4 border-b border-zinc-900 pb-3 uppercase text-zinc-400">User Accounts</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 uppercase tracking-wider">
                    {['Username','Coins','XP','Level','Wins','Actions'].map(h => (
                      <th key={h} className="py-3 px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {adminUsers.map(u => (
                    <tr key={u.id} className="hover:bg-zinc-950/50 text-zinc-300">
                      <td className="py-3 px-4 font-semibold">{u.username}</td>
                      <td className="py-3 px-4 text-yellow-500 font-medium">{u.coins}</td>
                      <td className="py-3 px-4 text-purple-400">{u.xp}</td>
                      <td className="py-3 px-4">{u.level}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{u.wins}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-all" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE ROOM MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl bg-zinc-900 relative border border-purple-500/30 animate-question-in">
            <div className="text-center mb-5">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{MODE_CONFIG[roomMode]?.label}</span>
              <h3 className="text-xl font-black uppercase tracking-tight text-zinc-100 mt-1">Configure Room</h3>
            </div>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Difficulty</label>
                  <select value={difficulty} onChange={(e: any) => setDifficulty(e.target.value)} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-xs text-zinc-300 cursor-pointer">
                    <option value="easy">Easy (Beginner)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="hard">Hard (Advanced)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Language</label>
                  <select value={language} onChange={(e: any) => setLanguage(e.target.value)} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-xs text-zinc-300 cursor-pointer">
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="bilingual">Bilingual</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Questions</label>
                  <input type="number" value={questionsCount} onChange={e => setQuestionsCount(Math.max(1, Number(e.target.value)))} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-xs text-zinc-300" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Max Players</label>
                  <input type="number" value={maxPlayers} onChange={e => setMaxPlayers(Math.max(2, Number(e.target.value)))} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-xs text-zinc-300" />
                </div>
              </div>
              {roomMode !== 'puzzle' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block flex items-center gap-1.5">
                    <span className="text-cyan-400">✦</span> AI Custom Topic <span className="text-zinc-600 font-normal normal-case tracking-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={customTopic}
                    onChange={e => setCustomTopic(e.target.value)}
                    placeholder="e.g. Minecraft, Indian History, FIFA..."
                    maxLength={60}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:border-cyan-500 text-xs text-zinc-300 placeholder-zinc-600 transition-colors"
                  />
                  {customTopic.trim() && (
                    <p className="text-[10px] text-cyan-400 font-medium">✓ Gemini will generate all questions about "{customTopic.trim()}"</p>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3 py-2 bg-zinc-950/40 px-3 rounded-xl border border-zinc-800">
                <input type="checkbox" id="privateCheck" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} className="rounded border-zinc-800 bg-zinc-950 text-purple-600 focus:ring-0 w-4 h-4 cursor-pointer" />
                <label htmlFor="privateCheck" className="text-xs font-semibold text-zinc-400 cursor-pointer select-none">Private Room (invite only)</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-950 text-xs font-bold text-zinc-400 uppercase cursor-pointer transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/20 transition-all active:scale-95">
                  <PlusCircle size={14} /> Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;
