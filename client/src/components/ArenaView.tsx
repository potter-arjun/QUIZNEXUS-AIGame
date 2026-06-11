'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import SvgRenderer from './SvgRenderer';
import LeaderboardPreview from './LeaderboardPreview';
import { Flame, HelpCircle, ArrowRight, Users, Zap, Sparkles, Volume2, VolumeX, Scissors } from 'lucide-react';
import { getAvatarSvg } from '../utils/avatars';
import confetti from 'canvas-confetti';

// ── Module-level mute flag (persists across renders) ──────────────────────────
let _soundMuted = typeof window !== 'undefined' && localStorage.getItem('qb_muted') === '1';

function playSound(type: 'correct' | 'wrong' | 'tick' | 'submit' | 'powerup') {
  if (_soundMuted) return;
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    if (type === 'correct') {
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.connect(gain);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.22, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.35);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.35);
      });
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'tick') {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'square';
      osc.frequency.value = 1100;
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'submit') {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'sine';
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === 'powerup') {
      [880, 1100, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.connect(gain);
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.2);
      });
    }
  } catch { /* AudioContext blocked */ }
}

const REACTIONS = ['🔥', '😱', '🎉', '💀'];
const OPTION_KEYS = ['1', '2', '3', '4', 'a', 'b', 'c', 'd'];
const LETTERS = ['A', 'B', 'C', 'D'];

export const ArenaView: React.FC = () => {
  const { user } = useAuth();
  const {
    roomState, currentQuestion, questionIndex, totalQuestions,
    timerDuration, roundResults, submitAnswer, nextQuestion, answerProgress,
    eliminatedOptions, usePowerup, playerEliminated,
  } = useSocket();

  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [scorePopup, setScorePopup] = useState<{ pts: number; key: number } | null>(null);
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ emoji: string; id: number; x: number }>>([]);
  const [questionKey, setQuestionKey] = useState(0);
  const [isMuted, setIsMuted] = useState(_soundMuted);
  const [powerUpsUsed, setPowerUpsUsed] = useState({ fiftyFifty: false });
  const [autoAdvance, setAutoAdvance] = useState<number | null>(null);
  const [flashResult, setFlashResult] = useState<'correct' | 'wrong' | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [inventory, setInventory] = useState<{ fiftyFifty: number; doublePoints: number }>(() => {
    if (typeof window === 'undefined') return { fiftyFifty: 0, doublePoints: 0 };
    try { return { fiftyFifty: 0, doublePoints: 0, ...JSON.parse(localStorage.getItem('qb_inventory') || '{}') }; } catch { return { fiftyFifty: 0, doublePoints: 0 }; }
  });
  const [doubleActive, setDoubleActive] = useState(false);
  const prevTimeRef = useRef(timerDuration);
  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playerKey = Object.keys(roomState?.players || {}).find(
    id => roomState?.players[id].userId === user?.id
  ) || '';
  const me = roomState?.players[playerKey];
  const isHost = me?.isHost;

  // Reset on new question
  useEffect(() => {
    setTimeLeft(timerDuration);
    setSelectedOption(null);
    setHasSubmitted(false);
    setShowExplanation(false);
    setScorePopup(null);
    setQuestionKey(k => k + 1);
    setPowerUpsUsed({ fiftyFifty: false });
    setDoubleActive(false);
    setAutoAdvance(null);
    setFlashResult(null);
    prevTimeRef.current = timerDuration;
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
  }, [currentQuestion, timerDuration]);

  // Countdown + tick sounds
  useEffect(() => {
    if (roundResults) { setShowExplanation(true); return; }
    if (timeLeft <= 0) { if (!hasSubmitted) handleOptionSelect(''); return; }
    if (timeLeft <= 5 && timeLeft !== prevTimeRef.current) playSound('tick');
    prevTimeRef.current = timeLeft;
    const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, roundResults, hasSubmitted]);

  // Score popup + sound + flash + confetti when round results arrive
  useEffect(() => {
    if (!roundResults || !me) return;
    const myResult = roundResults.answers[me.id];
    if (!myResult) return;

    const isCorrect = myResult.isCorrect;
    playSound(isCorrect ? 'correct' : 'wrong');
    setFlashResult(isCorrect ? 'correct' : 'wrong');
    setFlashKey(k => k + 1);

    if (isCorrect) {
      confetti({
        particleCount: 55,
        spread: 70,
        startVelocity: 30,
        origin: { x: 0.5, y: 0.55 },
        colors: ['#34d399', '#10b981', '#6ee7b7', '#fbbf24', '#a855f7'],
        scalar: 0.9,
        gravity: 1.2,
      });
    }

    if (myResult.pointsEarned > 0) {
      const popup = { pts: myResult.pointsEarned, key: Date.now() };
      setScorePopup(popup);
      const t = setTimeout(() => setScorePopup(null), 1800);
      return () => clearTimeout(t);
    }
  }, [roundResults]);

  // Auto-advance countdown after round results (8s)
  useEffect(() => {
    if (!roundResults) { setAutoAdvance(null); return; }
    setAutoAdvance(8);
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    autoAdvanceRef.current = setInterval(() => {
      setAutoAdvance(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(autoAdvanceRef.current!);
          if (isHost) nextQuestion();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current); };
  }, [roundResults]);

  // Keyboard shortcuts: 1/2/3/4 or A/B/C/D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (hasSubmitted || roundResults || !currentQuestion) return;
      const key = e.key.toLowerCase();
      if (!OPTION_KEYS.includes(key)) return;
      const idx = ['1', 'a'].includes(key) ? 0 : ['2', 'b'].includes(key) ? 1 : ['3', 'c'].includes(key) ? 2 : 3;
      const letter = LETTERS[idx];
      if (eliminatedOptions.includes(letter)) return;
      handleOptionSelect(letter);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasSubmitted, roundResults, currentQuestion, eliminatedOptions]);

  const handleOptionSelect = (optionLetter: string) => {
    if (hasSubmitted || roundResults || me?.eliminated) return;
    setSelectedOption(optionLetter);
    setHasSubmitted(true);
    if (optionLetter) playSound('submit');
    submitAnswer(optionLetter);
  };

  const consumeCharge = (key: 'fiftyFifty' | 'doublePoints') => {
    setInventory(prev => {
      const next = { ...prev, [key]: Math.max(0, (prev[key] ?? 0) - 1) };
      localStorage.setItem('qb_inventory', JSON.stringify(next));
      return next;
    });
  };

  const handleFiftyFifty = () => {
    if (powerUpsUsed.fiftyFifty || (inventory.fiftyFifty ?? 0) <= 0 || hasSubmitted || !!roundResults) return;
    setPowerUpsUsed(p => ({ ...p, fiftyFifty: true }));
    consumeCharge('fiftyFifty');
    playSound('powerup');
    usePowerup('fifty_fifty');
  };

  const handleDoublePoints = () => {
    if (doubleActive || (inventory.doublePoints ?? 0) <= 0 || hasSubmitted || !!roundResults) return;
    consumeCharge('doublePoints');
    setDoubleActive(true);
    playSound('powerup');
    usePowerup('double_points');
  };

  const handleSkip = () => {
    if (hasSubmitted || roundResults) return;
    setHasSubmitted(true);
    submitAnswer('');
  };

  const toggleMute = () => {
    const next = !isMuted;
    _soundMuted = next;
    localStorage.setItem('qb_muted', next ? '1' : '0');
    setIsMuted(next);
  };

  const sendReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const x = Math.random() * 70 + 15;
    setFloatingEmojis(prev => [...prev, { emoji, id, x }]);
    setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== id)), 2200);
  };

  if (!roomState || !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-zinc-500 text-xs font-bold mt-4 uppercase">Syncing Arena State...</span>
      </div>
    );
  }

  const isSvgOption = (opt: string) => opt.trim().startsWith('<svg');
  const players = Object.values(roomState.players);
  const redScore = players.filter(p => p.team === 'Red').reduce((s, p) => s + p.score, 0);
  const blueScore = players.filter(p => p.team === 'Blue').reduce((s, p) => s + p.score, 0);
  const mode = roomState.mode;

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const timerProgress = timerDuration > 0 ? timeLeft / timerDuration : 0;
  const strokeDashoffset = circumference * (1 - timerProgress);
  const timerColor = timeLeft <= 5 ? '#ef4444' : timeLeft <= Math.ceil(timerDuration * 0.35) ? '#f97316' : mode === 'rapid' ? '#f87171' : mode === 'puzzle' ? '#14b8a6' : '#22d3ee';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 relative">

      {/* Screen flash overlay on result */}
      {flashResult && (
        <div
          key={flashKey}
          className={`fixed inset-0 z-40 pointer-events-none ${flashResult === 'correct' ? 'animate-flash-correct' : 'animate-flash-wrong'}`}
          style={{ background: flashResult === 'correct' ? 'rgba(52,211,153,0.13)' : 'rgba(239,68,68,0.11)' }}
        />
      )}

      {/* Floating emoji reactions */}
      {floatingEmojis.map(e => (
        <div key={e.id} className="fixed bottom-28 pointer-events-none z-50 text-3xl animate-emoji-float select-none" style={{ left: `${e.x}%` }}>
          {e.emoji}
        </div>
      ))}

      {/* Floating +pts popup */}
      {scorePopup && (
        <div key={scorePopup.key} className="fixed top-20 right-8 pointer-events-none z-50 animate-float-score">
          <span className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]">
            +{scorePopup.pts} pts!
          </span>
        </div>
      )}

      {/* Mode banners */}
      {/* Player eliminated toast */}
      {playerEliminated && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-zinc-950/95 border border-rose-500/50 backdrop-blur-md shadow-2xl animate-question-in flex items-center gap-3 pointer-events-none">
          <span className="text-2xl">💀</span>
          <div>
            <p className="text-sm font-black text-rose-300">{playerEliminated.username} eliminated!</p>
            <p className="text-[10px] text-zinc-500 font-medium">{playerEliminated.survivorCount} survivor{playerEliminated.survivorCount !== 1 ? 's' : ''} remaining</p>
          </div>
        </div>
      )}

      {mode === 'rapid' && (
        <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <Zap size={14} fill="currentColor" />
          <span className="text-xs font-black uppercase tracking-widest">Rapid Fire — 2x Points — 10s Per Question</span>
          <Zap size={14} fill="currentColor" />
        </div>
      )}
      {mode === 'puzzle' && (
        <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
          <span className="text-sm">🧩</span>
          <span className="text-xs font-black uppercase tracking-widest">Puzzle Mode — 45s to Think — +5 Bonus for First Correct</span>
          <span className="text-sm">🧩</span>
        </div>
      )}
      {mode === 'team' && (
        <div className="flex items-center justify-between gap-4 mb-4 px-5 py-3 rounded-xl bg-zinc-950/40 border border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-red-400 uppercase">Red Team</span>
            <span className="text-xl font-black text-red-400">{redScore}</span>
          </div>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Team Scores</span>
          <div className="flex items-center gap-3">
            <span className="text-xl font-black text-blue-400">{blueScore}</span>
            <span className="text-xs font-black text-blue-400 uppercase">Blue Team</span>
          </div>
        </div>
      )}
      {mode === 'battle_royale' && (
        <div className="flex items-center justify-between gap-3 mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400">
            <span className="text-sm">💀</span>
            <span className="text-xs font-black uppercase tracking-widest">Battle Royale — 3 Lives — Last Standing Wins</span>
          </div>
          {me && !me.eliminated && (
            <div className="flex items-center gap-0.5 shrink-0">
              {[0, 1, 2].map(i => (
                <span key={i} className={`text-base transition-all duration-300 ${i < (me.lives ?? 3) ? '' : 'opacity-20 grayscale'}`}>❤️</span>
              ))}
            </div>
          )}
        </div>
      )}
      {mode === 'battle_royale' && me?.eliminated && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-zinc-950/80 border border-rose-500/30 flex items-center gap-3">
          <span className="text-2xl">💀</span>
          <div>
            <p className="text-sm font-black text-rose-400">You were eliminated!</p>
            <p className="text-xs text-zinc-500">Watching as a spectator — stay to see who wins...</p>
          </div>
        </div>
      )}

      {mode === 'classroom' && answerProgress && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Users size={14} className="text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
            {answerProgress.answered} of {answerProgress.total} answered
          </span>
          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(answerProgress.answered / answerProgress.total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Top Telemetry Bar */}
      <div className={`flex items-center justify-between p-4 rounded-2xl border mb-6 gap-3 ${
        mode === 'rapid' ? 'bg-rose-950/20 border-rose-500/20' : mode === 'classroom' ? 'bg-emerald-950/10 border-emerald-500/10' : 'bg-zinc-950/40 border-purple-500/10'
      }`}>

        {/* Progress */}
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">
            {currentQuestion.category.toUpperCase()} • Q
          </span>
          <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 font-mono">
            {questionIndex + 1}/{totalQuestions}
          </span>
          <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }} />
          </div>
        </div>

        {/* Power-ups */}
        <div className="flex flex-col gap-1.5">
          {doubleActive && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-widest animate-pulse">
              <Zap size={10} /> 2× ACTIVE
            </div>
          )}
          <div className="flex items-center gap-2">
            {/* 50/50 — costs a charge from inventory */}
            <button
              onClick={handleFiftyFifty}
              disabled={powerUpsUsed.fiftyFifty || (inventory.fiftyFifty ?? 0) <= 0 || hasSubmitted || !!roundResults}
              title={`50/50 — eliminate 2 wrong answers (${inventory.fiftyFifty ?? 0} charges)`}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-black uppercase transition-all cursor-pointer ${
                powerUpsUsed.fiftyFifty || (inventory.fiftyFifty ?? 0) <= 0 || hasSubmitted || !!roundResults
                  ? 'bg-zinc-900/20 border-zinc-800 text-zinc-600 opacity-40 cursor-not-allowed'
                  : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 active:scale-95 animate-powerup-glow'
              }`}
            >
              <Scissors size={13} />
              50/50
              <span className="text-[10px] opacity-70">[{inventory.fiftyFifty ?? 0}]</span>
            </button>
            {/* Double Points — costs a charge from inventory */}
            <button
              onClick={handleDoublePoints}
              disabled={doubleActive || (inventory.doublePoints ?? 0) <= 0 || hasSubmitted || !!roundResults}
              title={`Double Points — next correct answer earns 2× (${inventory.doublePoints ?? 0} charges)`}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-black uppercase transition-all cursor-pointer ${
                doubleActive || (inventory.doublePoints ?? 0) <= 0 || hasSubmitted || !!roundResults
                  ? 'bg-zinc-900/20 border-zinc-800 text-zinc-600 opacity-40 cursor-not-allowed'
                  : 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 active:scale-95 animate-powerup-glow'
              }`}
            >
              <Zap size={13} />
              2×
              <span className="text-[10px] opacity-70">[{inventory.doublePoints ?? 0}]</span>
            </button>
            {/* Skip — always free */}
            <button
              onClick={handleSkip}
              disabled={hasSubmitted || !!roundResults}
              title="Skip this question"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-black uppercase transition-all cursor-pointer ${
                hasSubmitted || !!roundResults
                  ? 'bg-zinc-900/20 border-zinc-800 text-zinc-600 opacity-40 cursor-not-allowed'
                  : 'bg-zinc-800/40 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 active:scale-95'
              }`}
            >
              <ArrowRight size={13} /> Skip
            </button>
          </div>
        </div>

        {/* Streak */}
        {me && me.streak > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20 text-orange-400 animate-heartbeat">
            <Flame size={16} fill="#f97316" />
            <span className="text-xs font-extrabold">{me.streak}🔥</span>
            {mode === 'rapid' && <Sparkles size={12} className="text-rose-400" />}
          </div>
        )}

        {/* Circular timer + mute */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={toggleMute} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 cursor-pointer transition-all" title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <div className="relative flex items-center justify-center w-[72px] h-[72px]">
            <svg width="72" height="72" className="-rotate-90">
              <circle cx="36" cy="36" r={radius} stroke="#27272a" strokeWidth="5" fill="none" />
              <circle cx="36" cy="36" r={radius} stroke={timerColor} strokeWidth="5" fill="none"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s ease' }} />
            </svg>
            <span className={`absolute text-base font-black font-mono transition-colors ${timeLeft <= 5 ? 'animate-pulse' : ''}`} style={{ color: timerColor }}>
              {timeLeft}
            </span>
          </div>
        </div>

      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Question + Options */}
        <div className="lg:col-span-2 space-y-6">
          <div key={questionKey} className="glass-panel p-6 rounded-3xl bg-zinc-950/30 flex flex-col items-stretch animate-question-in">

            <div className="mb-6">
              <h2 className="text-lg md:text-xl font-bold leading-snug text-zinc-200">
                {currentQuestion.question}
              </h2>
              {/* Keyboard hint */}
              {!hasSubmitted && !roundResults && (
                <p className="text-[10px] text-zinc-600 font-bold mt-2 uppercase tracking-widest">
                  Press 1 / 2 / 3 / 4 to answer instantly
                </p>
              )}
            </div>

            {currentQuestion.questionSvg && (
              <div className="w-full max-w-[280px] h-[280px] mx-auto bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden p-4 mb-6 shadow-inner">
                <SvgRenderer svgContent={currentQuestion.questionSvg} />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, idx) => {
                const optionLetter = LETTERS[idx];
                const isEliminated = eliminatedOptions.includes(optionLetter);
                const isSelected = selectedOption === optionLetter;
                const isCorrectAnswer = roundResults?.correctAnswer === optionLetter;
                const isMyWrongAnswer = roundResults && isSelected && !isCorrectAnswer;

                let optionStyle = 'border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-purple-500/50 hover:bg-purple-500/5';
                let animClass = '';

                if (isEliminated && !roundResults) {
                  optionStyle = 'border-zinc-900 bg-zinc-950/10 text-zinc-700 opacity-25 cursor-not-allowed line-through';
                } else if (roundResults) {
                  if (isCorrectAnswer) {
                    optionStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold shadow-lg shadow-emerald-500/10';
                    animClass = 'animate-pop-correct';
                  } else if (isMyWrongAnswer) {
                    optionStyle = 'border-rose-500 bg-rose-500/10 text-rose-400 font-bold';
                    animClass = 'animate-shake';
                  } else {
                    optionStyle = 'border-zinc-900 bg-zinc-950/10 text-zinc-600 opacity-35';
                  }
                } else if (isSelected) {
                  optionStyle = 'border-purple-500 bg-purple-500/15 text-purple-200 ring-2 ring-purple-500/30';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={hasSubmitted || !!roundResults || isEliminated}
                    onClick={() => !isEliminated && handleOptionSelect(optionLetter)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-center gap-3 cursor-pointer ${
                      !hasSubmitted && !roundResults && !isEliminated ? 'hover:scale-[1.02] active:scale-[0.98]' : ''
                    } ${optionStyle} ${animClass}`}
                  >
                    {/* Letter badge with keyboard shortcut hint */}
                    <div className="flex flex-col items-center shrink-0">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm border transition-colors ${
                        isCorrectAnswer && roundResults ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : isSelected ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                      }`}>
                        {optionLetter}
                      </span>
                      {!hasSubmitted && !roundResults && !isEliminated && (
                        <span className="text-[8px] text-zinc-700 font-bold mt-0.5">{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden flex items-center">
                      {isSvgOption(option) ? (
                        <div className="w-full max-w-[150px] h-[120px] p-1">
                          <SvgRenderer svgContent={option} />
                        </div>
                      ) : (
                        <span className="text-sm font-medium leading-relaxed w-full">{option}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Waiting + emoji reactions */}
            {hasSubmitted && !roundResults && (
              <div className="flex flex-col items-center gap-3 mt-6">
                <div className="text-center text-xs font-semibold text-purple-400 bg-purple-500/5 py-2.5 px-4 rounded-xl border border-purple-500/10 animate-pulse uppercase tracking-wider w-full">
                  Answer locked in! Waiting for opponents...
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-600 uppercase font-bold">React:</span>
                  {REACTIONS.map(emoji => (
                    <button key={emoji} onClick={() => sendReaction(emoji)}
                      className="text-xl p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:scale-125 hover:border-zinc-600 active:scale-95 transition-all cursor-pointer">
                      {emoji}
                    </button>
                  ))}
                </div>
                {mode === 'classroom' && isHost && (
                  <button onClick={nextQuestion}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold uppercase flex items-center gap-1.5 cursor-pointer transition-all active:scale-95">
                    <ArrowRight size={13} /> Force Next Question
                  </button>
                )}
              </div>
            )}

          </div>

          {/* Round explanation panel */}
          {showExplanation && roundResults && (
            <div className="glass-panel p-5 rounded-3xl border border-purple-500/20 bg-zinc-950/40 space-y-4 animate-question-in">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wide ${
                    roundResults.answers[me?.id || '']?.isCorrect ? 'bg-emerald-500 text-zinc-950' : 'bg-rose-500 text-white'
                  }`}>
                    {roundResults.answers[me?.id || '']?.isCorrect ? '✓ CORRECT!' : '✗ INCORRECT'}
                  </span>
                  <span className="text-zinc-400 text-xs font-semibold">
                    +{roundResults.answers[me?.id || '']?.pointsEarned || 0} pts
                  </span>
                </div>

                {/* Auto-advance countdown + Next button */}
                <div className="flex items-center gap-2">
                  {autoAdvance !== null && (
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg border transition-colors ${
                      autoAdvance <= 3 ? 'text-rose-400 border-rose-500/20 bg-rose-500/10 animate-tick-pop' : 'text-zinc-500 border-zinc-800 bg-zinc-900/40'
                    }`}>
                      {isHost ? `Auto next in ${autoAdvance}s` : `Next in ${autoAdvance}s`}
                    </span>
                  )}
                  {isHost ? (
                    <button onClick={() => { if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current); nextQuestion(); }}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold uppercase flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md shadow-purple-600/20">
                      Next <ArrowRight size={13} />
                    </button>
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Waiting for host...
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
                  <HelpCircle size={14} /> EXPLANATION
                </h4>
                <p className="text-xs leading-relaxed text-zinc-400">{roundResults.explanation}</p>
              </div>

              <div className="border-t border-zinc-900/60 pt-3">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">Round Speed</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(roundResults.answers).map(([pId, val]) => {
                    const player = roomState.players[pId];
                    if (!player) return null;
                    return (
                      <div key={pId} className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border text-[10px] ${
                        val.isCorrect ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400' : 'bg-rose-500/5 border-rose-500/15 text-rose-400'
                      }`}>
                        <div dangerouslySetInnerHTML={{ __html: getAvatarSvg(player.avatarUrl, 16) }} className="w-4 h-4 rounded-full bg-zinc-800" />
                        <span className="font-semibold">{player.username}</span>
                        <span className="text-zinc-600">•</span>
                        <span>{(val.responseTime / 1000).toFixed(2)}s</span>
                        {val.pointsEarned > 0 && <span className="text-emerald-400 font-black">+{val.pointsEarned}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Scoreboard */}
        <div className="lg:col-span-1">
          <LeaderboardPreview />
        </div>

      </div>
    </div>
  );
};

export default ArenaView;
