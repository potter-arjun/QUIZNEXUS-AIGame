'use client';

import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { getAvatarSvg } from '../utils/avatars';
import { Trophy, Award, Timer, Target, ArrowRight, Coins, Sparkles, Star, Share2, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

// ── Victory fanfare ─────────────────────────────────────────────────
function playVictoryFanfare(isWinner: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    type OscType = 'sine' | 'square' | 'triangle' | 'sawtooth';
    const notes: { freq: number; dur: number; type: OscType; vol: number }[] = isWinner
      ? [
          { freq: 523,  dur: 0.10, type: 'sine', vol: 0.5 },
          { freq: 659,  dur: 0.10, type: 'sine', vol: 0.5 },
          { freq: 784,  dur: 0.10, type: 'sine', vol: 0.5 },
          { freq: 1047, dur: 0.35, type: 'sine', vol: 0.6 },
          { freq: 784,  dur: 0.08, type: 'sine', vol: 0.4 },
          { freq: 1047, dur: 0.08, type: 'sine', vol: 0.4 },
          { freq: 1319, dur: 0.65, type: 'sine', vol: 0.7 },
        ]
      : [
          { freq: 523,  dur: 0.12, type: 'triangle', vol: 0.3 },
          { freq: 659,  dur: 0.12, type: 'triangle', vol: 0.3 },
          { freq: 784,  dur: 0.40, type: 'triangle', vol: 0.35 },
        ];

    let t = ctx.currentTime + 0.05;
    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type;
      osc.frequency.value = n.freq;
      gain.gain.setValueAtTime(n.vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + n.dur + 0.05);
      t += n.dur * 0.88;
    });
  } catch {}
}

// ── Animated count-up ────────────────────────────────────────────────
function useCountUp(target: number, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const tid = setTimeout(() => {
      if (target === 0) { setVal(0); return; }
      let v = 0;
      const step = target / 35;
      const id = setInterval(() => {
        v = Math.min(v + step, target);
        setVal(Math.floor(v));
        if (v >= target) clearInterval(id);
      }, 28);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(tid);
  }, [target, delay]);
  return val;
}

// ── Floating star particles ──────────────────────────────────────────
const STAR_COLORS = ['#fbbf24', '#f59e0b', '#ec4899', '#a855f7', '#3b82f6', '#10b981', '#ff6b6b', '#fff'];
const StarParticles: React.FC<{ count?: number }> = ({ count = 18 }) => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {Array.from({ length: count }).map((_, i) => {
      const left = `${(i * 37 + 11) % 100}%`;
      const bottom = `${(i * 23 + 5) % 50}%`;
      const dur = `${2 + (i % 4) * 0.7}s`;
      const delay = `${(i * 0.35) % 3}s`;
      const color = STAR_COLORS[i % STAR_COLORS.length];
      const size = 8 + (i % 5) * 4;
      return (
        <div
          key={i}
          className="absolute animate-star-float"
          style={{ left, bottom, '--dur': dur, '--delay': delay } as React.CSSProperties}
        >
          <Star size={size} fill={color} color={color} style={{ opacity: 0.85 }} />
        </div>
      );
    })}
  </div>
);

export const WinnerView: React.FC = () => {
  const { user, token, updateLocalUser } = useAuth();
  const { roomState, gameOverState, leaveRoom, rematch } = useSocket();

  const [savedData, setSavedData] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [podiumReady, setPodiumReady] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (!myRecord || !roomState) return;
    const ordinal = myRank === 1 ? '1st' : myRank === 2 ? '2nd' : myRank === 3 ? '3rd' : `${myRank}th`;
    const text = [
      '🏆 Navodaya Quiz Battle Results',
      `Player: ${user?.username}`,
      `Score: ${myRecord.player.score} pts  |  Rank: ${ordinal} of ${leaderboard.length}`,
      `Accuracy: ${Math.round(myRecord.accuracy)}%  |  Avg Speed: ${myRecord.avgResponseTime.toFixed(2)}s`,
      `Mode: ${roomState.mode}  |  Difficulty: ${roomState.difficulty}`,
      `Play at: ${window.location.origin}`,
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const leaderboard = gameOverState?.leaderboard || [];
  const myRecord = leaderboard.find((item: any) => item.player.userId === user?.id);
  const myRank = leaderboard.findIndex((item: any) => item.player.userId === user?.id) + 1;
  const iWon = myRank === 1;

  const animatedAccuracy = useCountUp(Math.round(myRecord?.accuracy ?? 0), 800);

  // ── Confetti + sound on mount ────────────────────────────────────
  useEffect(() => {
    setPodiumReady(false);
    setTimeout(() => setPodiumReady(true), 100);

    playVictoryFanfare(iWon);

    if (iWon) {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 1200);

      // Massive initial burst
      confetti({
        particleCount: 200,
        spread: 120,
        startVelocity: 55,
        origin: { x: 0.5, y: 0.35 },
        colors: ['#fbbf24', '#f59e0b', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#ff6b6b', '#fff'],
        shapes: ['star', 'circle', 'square'],
        scalar: 1.6,
        gravity: 0.9,
        drift: 0.3,
        ticks: 300,
      });

      // Left cannon burst
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 55,
          spread: 65,
          startVelocity: 70,
          origin: { x: 0, y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#a855f7'],
          shapes: ['star'],
          scalar: 1.8,
        });
      }, 400);

      // Right cannon burst
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 125,
          spread: 65,
          startVelocity: 70,
          origin: { x: 1, y: 0.6 },
          colors: ['#ec4899', '#3b82f6', '#10b981'],
          shapes: ['star'],
          scalar: 1.8,
        });
      }, 700);

      // Second center burst (gold stars)
      setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 160,
          startVelocity: 45,
          origin: { x: 0.5, y: 0.25 },
          colors: ['#fbbf24', '#fff', '#f59e0b'],
          shapes: ['star'],
          scalar: 2.2,
          gravity: 1.1,
        });
      }, 1500);

      // Continuous side streams (5s)
      const end = Date.now() + 5000;
      const stream = () => {
        confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0, y: 0.5 }, colors: ['#fbbf24', '#a855f7', '#ec4899'], shapes: ['circle', 'star'], scalar: 1.2 });
        confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1, y: 0.5 }, colors: ['#3b82f6', '#10b981', '#fbbf24'], shapes: ['circle', 'star'], scalar: 1.2 });
        if (Date.now() < end) requestAnimationFrame(stream);
      };
      setTimeout(stream, 1200);

    } else {
      // Participation burst
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#a855f7', '#6366f1', '#ec4899', '#3b82f6'],
        shapes: ['circle', 'square'],
        scalar: 1.2,
      });
    }
  }, [iWon]);

  // ── Save match to DB ──────────────────────────────────────────────
  useEffect(() => {
    if (roomState && myRecord && token && !savedData && !saving) {
      setSaving(true);
      fetch(`${SERVER_URL}/api/user/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          roomCode: roomState.code,
          gameMode: roomState.mode,
          score: myRecord.player.score,
          rank: myRank,
          accuracy: myRecord.accuracy,
          avgResponseTime: myRecord.avgResponseTime,
        }),
      })
        .then(r => (r.ok ? r.json() : Promise.reject()))
        .then(data => { setSavedData(data); updateLocalUser(data.user); })
        .catch(() => {})
        .finally(() => setSaving(false));
    }
  }, [roomState, myRecord, token, savedData, myRank, updateLocalUser, saving]);

  if (leaderboard.length === 0) return null;

  const mode = roomState?.mode;
  const redTeamScore = leaderboard.reduce((s: number, i: any) => i.player.team === 'Red' ? s + i.player.score : s, 0);
  const blueTeamScore = leaderboard.reduce((s: number, i: any) => i.player.team === 'Blue' ? s + i.player.score : s, 0);
  const teamWinner = redTeamScore > blueTeamScore ? 'Red' : blueTeamScore > redTeamScore ? 'Blue' : 'Draw';

  return (
    <div className="relative max-w-4xl mx-auto px-4 py-6 flex flex-col items-center">

      {/* ── Flash overlay on rank 1 ── */}
      {showFlash && (
        <div className="fixed inset-0 z-50 pointer-events-none animate-flash-win"
          style={{ background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.55) 0%, rgba(168,85,247,0.35) 60%, transparent 100%)' }}
        />
      )}

      {/* ── Trophy + Header ── */}
      <div className="text-center mb-6 relative">
        <div className="inline-flex p-5 rounded-full mb-4 relative" style={{ background: 'rgba(251,191,36,0.08)' }}>
          {/* Spinning dashed ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-yellow-500/40 animate-ring-rotate" />
          <Trophy size={52} className="text-yellow-400 animate-trophy-glow" fill="rgba(251,191,36,0.18)" />
        </div>

        {iWon ? (
          <div className="animate-champion-bounce">
            <div className="text-5xl md:text-6xl font-black uppercase tracking-tight animate-rainbow-text leading-none">
              CHAMPION!
            </div>
            <p className="text-xs text-yellow-400/80 font-black uppercase tracking-widest mt-2 animate-heartbeat">
              🏆 &nbsp; YOU ARE THE WINNER &nbsp; 🏆
            </p>
          </div>
        ) : (
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 uppercase tracking-tight">
            {mode === 'battle_royale' ? 'LAST SURVIVOR' : mode === 'team' ? 'TEAM RESULTS' : mode === 'rapid' ? 'RAPID FIRE COMPLETE' : mode === 'puzzle' ? 'PUZZLE COMPLETE' : 'VICTORY STANDINGS'}
          </h1>
        )}

        <p className="text-xs text-zinc-500 font-bold uppercase mt-1.5 tracking-wider">
          {mode === 'battle_royale' ? 'Battle Royale Over • All Others Eliminated' : mode === 'rapid' ? 'Rapid Fire Complete • 2x Points Applied' : mode === 'classroom' ? 'Session Complete • Instructor Results' : mode === 'puzzle' ? 'Puzzle Mode Complete • Brain Battle Done!' : 'Match Complete • Winners Announced'}
        </p>
      </div>

      {/* ── Team Banner ── */}
      {mode === 'team' && (
        <div className={`w-full max-w-2xl mb-6 p-5 rounded-2xl border text-center ${
          teamWinner === 'Red' ? 'bg-red-500/10 border-red-500/30' : teamWinner === 'Blue' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-zinc-800/30 border-zinc-700'
        }`}>
          <p className="text-xs font-bold uppercase text-zinc-500 mb-1">Team Winner</p>
          <p className={`text-3xl font-black uppercase ${teamWinner === 'Red' ? 'text-red-400' : teamWinner === 'Blue' ? 'text-blue-400' : 'text-zinc-400'}`}>
            {teamWinner === 'Draw' ? "It's a Draw!" : `${teamWinner} Team Wins!`}
          </p>
          <div className="flex justify-center gap-8 mt-3">
            <div className="text-center"><p className="text-xs text-zinc-500 font-bold uppercase">Red Team</p><p className="text-xl font-black text-red-400">{redTeamScore} pts</p></div>
            <div className="text-center"><p className="text-xs text-zinc-500 font-bold uppercase">Blue Team</p><p className="text-xl font-black text-blue-400">{blueTeamScore} pts</p></div>
          </div>
        </div>
      )}

      {/* ── Podium ── */}
      <div className="w-full max-w-2xl rounded-3xl p-6 mb-6 relative overflow-hidden"
        style={{ background: 'rgba(10,6,30,0.6)', border: '1px solid rgba(168,85,247,0.15)', backdropFilter: 'blur(16px)' }}>

        {/* Star particles float behind podium */}
        <StarParticles count={22} />

        <div className="flex flex-col sm:flex-row items-end justify-center gap-4 sm:gap-1 mb-8 pt-10 relative z-10">

          {/* 2nd Place */}
          {leaderboard[1] && (
            <div className="flex flex-col items-center w-full max-w-[150px] order-2 sm:order-1 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
              <div dangerouslySetInnerHTML={{ __html: getAvatarSvg(leaderboard[1].player.avatarUrl, 46) }}
                className="w-12 h-12 bg-zinc-800 rounded-full border-2 border-zinc-500/50 p-0.5 shadow-lg" />
              <span className="text-xs font-bold text-zinc-300 truncate mt-2 w-full text-center">{leaderboard[1].player.username}</span>
              <span className="text-[11px] text-zinc-400 font-extrabold">{leaderboard[1].player.score} pts</span>
              <div className={`w-full h-16 rounded-t-xl mt-3 flex items-center justify-center font-black text-2xl text-zinc-300 ${podiumReady ? 'animate-podium-rise' : 'opacity-0'}`}
                style={{ background: 'linear-gradient(180deg,rgba(113,113,122,0.3) 0%,rgba(63,63,70,0.4) 100%)', borderTop: '2px solid rgba(113,113,122,0.4)', animationDelay: '0.3s' }}>
                🥈 2nd
              </div>
            </div>
          )}

          {/* 1st Place */}
          {leaderboard[0] && (
            <div className="flex flex-col items-center w-full max-w-[175px] order-1 sm:order-2 animate-winner-entrance" style={{ animationDelay: '0.05s' }}>
              <div className="relative mb-1">
                {/* Crown */}
                <CrownIcon className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-400 animate-champion-bounce drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                {/* Avatar with halo */}
                <div
                  dangerouslySetInnerHTML={{ __html: getAvatarSvg(leaderboard[0].player.avatarUrl, 64) }}
                  className="w-16 h-16 bg-zinc-900 rounded-full border-[3px] border-yellow-400 p-0.5 animate-winner-halo"
                />
              </div>
              <span className="text-sm font-black animate-rainbow-text mt-2 truncate w-full text-center">{leaderboard[0].player.username}</span>
              <span className="text-xs text-yellow-400 font-black animate-score-reveal" style={{ animationDelay: '0.5s' }}>{leaderboard[0].player.score} pts</span>
              <div className={`w-full h-28 rounded-t-2xl mt-3 flex flex-col items-center justify-center font-black text-3xl text-yellow-400 ${podiumReady ? 'animate-podium-rise' : 'opacity-0'}`}
                style={{ background: 'linear-gradient(180deg,rgba(251,191,36,0.18) 0%,rgba(245,158,11,0.08) 100%)', borderTop: '3px solid rgba(251,191,36,0.5)', animationDelay: '0.1s', boxShadow: '0 -4px 40px rgba(251,191,36,0.12)' }}>
                🏆 1st
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {leaderboard[2] && (
            <div className="flex flex-col items-center w-full max-w-[150px] order-3 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
              <div dangerouslySetInnerHTML={{ __html: getAvatarSvg(leaderboard[2].player.avatarUrl, 42) }}
                className="w-11 h-11 bg-zinc-800 rounded-full border-2 border-amber-700/50 p-0.5 shadow-lg" />
              <span className="text-xs font-bold text-zinc-400 truncate mt-2 w-full text-center">{leaderboard[2].player.username}</span>
              <span className="text-[11px] text-zinc-500 font-extrabold">{leaderboard[2].player.score} pts</span>
              <div className={`w-full h-12 rounded-t-lg mt-3 flex items-center justify-center font-black text-xl text-amber-700 ${podiumReady ? 'animate-podium-rise' : 'opacity-0'}`}
                style={{ background: 'linear-gradient(180deg,rgba(120,53,15,0.25) 0%,rgba(92,45,14,0.15) 100%)', borderTop: '2px solid rgba(146,64,14,0.4)', animationDelay: '0.45s' }}>
                🥉 3rd
              </div>
            </div>
          )}

        </div>

        {/* Full leaderboard list (4th onward) */}
        {leaderboard.length > 3 && (
          <div className="relative z-10 border-t border-zinc-900/60 pt-4 space-y-2 mb-4">
            {leaderboard.slice(3).map((item: any, i: number) => (
              <div key={item.player.id} className={`flex items-center justify-between px-4 py-2 rounded-xl border border-zinc-900 ${item.player.userId === user?.id ? 'bg-purple-500/10 border-purple-500/20' : 'bg-zinc-950/40'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-zinc-500 w-6 text-center">{i + 4}.</span>
                  <div dangerouslySetInnerHTML={{ __html: getAvatarSvg(item.player.avatarUrl, 28) }} className="w-7 h-7 rounded-full bg-zinc-800" />
                  <span className="text-xs font-semibold text-zinc-300">{item.player.username}</span>
                </div>
                <span className="text-xs font-extrabold text-zinc-400">{item.player.score} pts</span>
              </div>
            ))}
          </div>
        )}

        {/* My Stats */}
        {myRecord && (
          <div className="relative z-10 border-t border-zinc-900/60 pt-5 space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">Your Match Stats</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-950/60 border border-zinc-900 p-3.5 rounded-2xl flex flex-col items-center">
                <Award size={15} className="text-purple-400 mb-1.5" />
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Placement</span>
                <span className="text-sm font-black text-zinc-200 mt-1">{myRank} of {leaderboard.length}</span>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-900 p-3.5 rounded-2xl flex flex-col items-center">
                <Target size={15} className="text-cyan-400 mb-1.5" />
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Accuracy</span>
                <span className="text-sm font-black text-zinc-200 mt-1">{animatedAccuracy}%</span>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-900 p-3.5 rounded-2xl flex flex-col items-center">
                <Timer size={15} className="text-orange-400 mb-1.5" />
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Avg Speed</span>
                <span className="text-sm font-black text-zinc-200 mt-1">{myRecord.avgResponseTime.toFixed(2)}s</span>
              </div>
            </div>

            {/* Rewards */}
            {savedData && (
              <div className="rounded-2xl p-4 flex items-center justify-center gap-6 flex-wrap"
                style={{ background: 'linear-gradient(135deg,rgba(168,85,247,0.08),rgba(236,72,153,0.08))', border: '1px solid rgba(168,85,247,0.15)' }}>
                <div className="flex items-center gap-2 text-yellow-400 font-extrabold text-sm animate-count-up">
                  <Coins size={18} />
                  <span>+{savedData.coinsAwarded} Coins</span>
                </div>
                <div className="flex items-center gap-2 text-purple-400 font-extrabold text-sm animate-count-up">
                  <Sparkles size={18} />
                  <span>+{savedData.xpAwarded} XP</span>
                </div>
                {savedData.isLevelUp && (
                  <span className="px-3 py-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-black rounded-lg uppercase tracking-wide animate-heartbeat shadow-lg shadow-pink-600/30">
                    ⬆ Level Up!
                  </span>
                )}
              </div>
            )}

            {savedData?.unlockedAchievements?.length > 0 && (
              <div className="p-3.5 rounded-xl text-center animate-fade-in-up"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <p className="text-amber-300 text-xs font-black">🎉 Achievement Unlocked!</p>
                <p className="text-amber-400/80 text-[11px] mt-0.5">{savedData.unlockedAchievements.join(' · ')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Action buttons ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
        {/* Share Results */}
        <button
          onClick={handleShare}
          className="flex-1 px-5 py-3 rounded-2xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <Share2 size={15} />
          {copied ? '✓ Copied!' : 'Share Results'}
        </button>

        {/* Rematch */}
        <button
          onClick={rematch}
          className="flex-1 px-5 py-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <RefreshCw size={15} /> Rematch
        </button>

        {/* Dashboard */}
        <button
          onClick={leaveRoom}
          className="flex-1 px-5 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-purple-600/30 transition-all hover:scale-105 active:scale-95 animate-neon-pulse"
        >
          Dashboard <ArrowRight size={15} />
        </button>
      </div>

    </div>
  );
};

// Crown SVG
const CrownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M3 20h18" strokeWidth="2" />
  </svg>
);

export default WinnerView;
