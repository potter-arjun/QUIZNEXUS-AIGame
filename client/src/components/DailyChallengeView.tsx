'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAvatarSvg } from '../utils/avatars';
import { Trophy, Coins, Sparkles, ArrowRight, Calendar, CheckCircle2 } from 'lucide-react';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
const QUESTION_TIME = 30;
const LETTERS = ['A', 'B', 'C', 'D'] as const;

interface DQuestion {
  question: string;
  options: string[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  category: string;
  type: string;
}

interface AnswerRecord {
  answer: string;
  responseTime: number;
  isCorrect: boolean;
  points: number;
}

function calcPoints(isCorrect: boolean, responseTime: number): number {
  if (!isCorrect) return 0;
  return 10 + Math.floor(Math.max(0, QUESTION_TIME - responseTime) / QUESTION_TIME * 10);
}

function msToMidnightUTC(): string {
  const midnight = new Date();
  midnight.setUTCHours(24, 0, 0, 0);
  const diff = Math.max(0, Math.floor((midnight.getTime() - Date.now()) / 1000));
  const h = Math.floor(diff / 3600).toString().padStart(2, '0');
  const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
  const s = (diff % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

const DailyLeaderboard: React.FC<{ entries: any[]; userId?: string }> = ({ entries, userId }) => (
  <div className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-6">
    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
      <Trophy size={12} className="text-yellow-400" /> Today's Leaderboard
    </h3>
    <div className="space-y-2">
      {entries.map((entry: any, idx: number) => {
        const isMe = entry.user?.id === userId;
        return (
          <div key={entry.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${isMe ? 'bg-purple-500/10 border-purple-500/20' : 'bg-zinc-900/30 border-transparent'}`}>
            <span className="text-xs font-black text-zinc-500 w-5 text-center shrink-0">
              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
            </span>
            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-zinc-700"
              dangerouslySetInnerHTML={{ __html: getAvatarSvg(entry.user?.avatarUrl ?? '', 28) }} />
            <span className={`text-xs font-bold flex-1 truncate ${isMe ? 'text-purple-300' : 'text-zinc-200'}`}>
              {entry.user?.username}{isMe && ' (you)'}
            </span>
            <span className="text-[10px] text-zinc-500 shrink-0">{Math.round(entry.accuracy)}%</span>
            <span className="text-sm font-black text-yellow-400 w-12 text-right shrink-0">{entry.score}</span>
          </div>
        );
      })}
    </div>
  </div>
);

export const DailyChallengeView: React.FC = () => {
  const { user, token, updateLocalUser } = useAuth();

  const [phase, setPhase] = useState<'loading' | 'ready' | 'playing' | 'done'>('loading');
  const [questions, setQuestions] = useState<DQuestion[]>([]);
  const [date, setDate] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [myEntry, setMyEntry] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [countdown, setCountdown] = useState(msToMidnightUTC());
  const [saveData, setSaveData] = useState<{ coinsAwarded: number; xpAwarded: number } | null>(null);
  const [finalStats, setFinalStats] = useState<{ totalScore: number; correct: number; accuracy: number } | null>(null);

  const questionStartTime = useRef(Date.now());
  const answersRef = useRef<AnswerRecord[]>([]);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [qRes, lRes] = await Promise.all([
          fetch(`${SERVER_URL}/api/daily/today`),
          fetch(`${SERVER_URL}/api/daily/leaderboard`),
        ]);
        const qData = await qRes.json();
        if (qData.questions) { setQuestions(qData.questions); setDate(qData.date); }
        const lData = await lRes.json();
        if (lData.entries) setLeaderboard(lData.entries);

        if (token) {
          const sRes = await fetch(`${SERVER_URL}/api/daily/status`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const sData = await sRes.json();
          if (sData.played) { setAlreadyPlayed(true); setMyEntry(sData.entry); }
        }
      } catch {}
      setPhase('ready');
    };
    init();
    return () => { if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current); };
  }, [token]);

  useEffect(() => {
    const t = setInterval(() => setCountdown(msToMidnightUTC()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (phase !== 'playing' || showResult) return;
    if (timeLeft <= 0) { handleAnswer(''); return; }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, phase, showResult]);

  const handleAnswer = useCallback((optionLetter: string) => {
    if (showResult || phase !== 'playing') return;
    const responseTime = (Date.now() - questionStartTime.current) / 1000;
    const q = questions[questionIndex];
    const isCorrect = optionLetter !== '' && optionLetter === q.correctAnswer;
    const record: AnswerRecord = { answer: optionLetter, responseTime, isCorrect, points: calcPoints(isCorrect, responseTime) };
    answersRef.current = [...answersRef.current, record];
    setSelectedOption(optionLetter || null);
    setShowResult(true);

    advanceTimeoutRef.current = setTimeout(async () => {
      const next = questionIndex + 1;
      if (next >= questions.length) {
        const all = answersRef.current;
        const totalScore = all.reduce((s, a) => s + a.points, 0);
        const correct = all.filter(a => a.isCorrect).length;
        const accuracy = Math.round((correct / all.length) * 100);
        const avgResponseTime = all.reduce((s, a) => s + a.responseTime, 0) / all.length;
        setFinalStats({ totalScore, correct, accuracy });
        setPhase('done');

        if (token) {
          try {
            const res = await fetch(`${SERVER_URL}/api/daily/submit`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ score: totalScore, accuracy, avgResponseTime }),
            });
            const data = await res.json();
            if (res.ok) {
              setSaveData({ coinsAwarded: data.coinsAwarded, xpAwarded: data.xpAwarded });
              if (data.user) updateLocalUser(data.user);
              const lRes = await fetch(`${SERVER_URL}/api/daily/leaderboard`);
              const lData = await lRes.json();
              if (lData.entries) setLeaderboard(lData.entries);
            }
          } catch {}
        }
      } else {
        setQuestionIndex(next);
        setTimeLeft(QUESTION_TIME);
        setSelectedOption(null);
        setShowResult(false);
        questionStartTime.current = Date.now();
      }
    }, 1600);
  }, [showResult, phase, questions, questionIndex, token, updateLocalUser]);

  const startGame = () => {
    answersRef.current = [];
    setQuestionIndex(0);
    setTimeLeft(QUESTION_TIME);
    setSelectedOption(null);
    setShowResult(false);
    questionStartTime.current = Date.now();
    setPhase('playing');
  };

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === 'playing') {
    const q = questions[questionIndex];
    const timerPct = timeLeft / QUESTION_TIME;
    const timerColor = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f97316' : '#22d3ee';
    const circumference = 2 * Math.PI * 24;

    return (
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
              <span className="truncate max-w-[180px]">{q.category}</span>
              <span className="text-zinc-300 shrink-0">{questionIndex + 1} / {questions.length}</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
            </div>
          </div>
          <div className="relative shrink-0 w-14 h-14">
            <svg width="56" height="56" className="-rotate-90">
              <circle cx="28" cy="28" r="24" stroke="#27272a" strokeWidth="4" fill="none" />
              <circle cx="28" cy="28" r="24" stroke={timerColor} strokeWidth="4" fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - timerPct)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }} />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-sm font-black ${timeLeft <= 5 ? 'animate-pulse' : ''}`}
              style={{ color: timerColor }}>{timeLeft}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800/60 bg-zinc-950/40 p-6">
          <p className="text-base font-bold text-zinc-100 mb-6 leading-snug">{q.question}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map((opt, idx) => {
              const letter = LETTERS[idx];
              const isCorrectAns = q.correctAnswer === letter;
              const isSelected = selectedOption === letter;
              let cls = 'border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-purple-500/50 hover:bg-purple-500/5 cursor-pointer';
              if (showResult) {
                if (isCorrectAns) cls = 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold';
                else if (isSelected) cls = 'border-rose-500 bg-rose-500/10 text-rose-400';
                else cls = 'border-zinc-900 bg-zinc-950/10 text-zinc-700 opacity-40';
              }
              return (
                <button key={idx} disabled={showResult}
                  onClick={() => !showResult && handleAnswer(letter)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${cls}`}>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black border shrink-0 ${
                    isCorrectAns && showResult ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : isSelected ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}>{letter}</span>
                  <span className="text-sm">{opt}</span>
                </button>
              );
            })}
          </div>
          {showResult && q.explanation && (
            <p className="mt-4 pt-3 border-t border-zinc-800 text-xs text-zinc-500 italic">{q.explanation}</p>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'done' && finalStats) {
    const myRank = leaderboard.findIndex((e: any) => e.user?.id === user?.id) + 1;
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
        <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 to-indigo-950/30 p-8 text-center">
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Daily Challenge Complete!</p>
          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            {finalStats.totalScore}
          </div>
          <p className="text-xs text-zinc-500 font-bold mt-1">out of 200 points</p>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <p className="text-xl font-black text-cyan-400">{finalStats.correct}/{questions.length}</p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Correct</p>
            </div>
            <div>
              <p className="text-xl font-black text-emerald-400">{finalStats.accuracy}%</p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Accuracy</p>
            </div>
            <div>
              <p className="text-xl font-black text-purple-400">{myRank > 0 ? `#${myRank}` : '—'}</p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Rank</p>
            </div>
          </div>
          {saveData && (
            <div className="flex items-center justify-center gap-6 mt-6 pt-5 border-t border-purple-500/15">
              <div className="flex items-center gap-2 text-yellow-400 font-extrabold text-sm">
                <Coins size={15} /> +{saveData.coinsAwarded} Coins
              </div>
              <div className="flex items-center gap-2 text-purple-400 font-extrabold text-sm">
                <Sparkles size={15} /> +{saveData.xpAwarded} XP
              </div>
            </div>
          )}
        </div>

        {leaderboard.length > 0 && <DailyLeaderboard entries={leaderboard} userId={user?.id} />}

        <p className="text-center text-[11px] text-zinc-600 font-medium">
          Next challenge in <span className="text-cyan-400 font-bold font-mono">{countdown}</span>
        </p>
      </div>
    );
  }

  // ready phase
  const displayDate = date
    ? new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      <div className={`rounded-3xl border p-8 text-center relative overflow-hidden ${
        alreadyPlayed
          ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-zinc-950/40'
          : 'border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 to-indigo-950/30'
      }`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.07),transparent_65%)] pointer-events-none" />
        <Calendar size={28} className={`mx-auto mb-3 ${alreadyPlayed ? 'text-emerald-400' : 'text-cyan-400'}`} />
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{displayDate}</p>
        <h2 className="text-2xl font-black text-zinc-100 uppercase tracking-tight">Daily Challenge</h2>
        <p className="text-xs text-zinc-500 mt-1">10 Questions · 30s Each · 200 Max Points · Same for everyone worldwide</p>

        {alreadyPlayed ? (
          <div className="mt-5 space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-black">
              <CheckCircle2 size={15} /> Completed — {myEntry?.score ?? '?'} pts
            </div>
            <p className="text-[11px] text-zinc-600">Come back tomorrow for a fresh set of questions</p>
          </div>
        ) : (
          <button onClick={startGame}
            className="mt-5 px-8 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm uppercase tracking-wider inline-flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-cyan-600/20">
            Play Now <ArrowRight size={15} />
          </button>
        )}

        <p className="text-[10px] text-zinc-600 mt-5 font-mono">
          Next challenge: <span className="text-cyan-500 font-bold">{countdown}</span>
        </p>
      </div>

      {leaderboard.length > 0
        ? <DailyLeaderboard entries={leaderboard} userId={user?.id} />
        : <p className="text-center py-8 text-zinc-600 text-sm">No scores yet today — be the first to play!</p>
      }
    </div>
  );
};

export default DailyChallengeView;
