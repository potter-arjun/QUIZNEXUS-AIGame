'use client';

import React from 'react';
import { useSocket } from '../context/SocketContext';
import { getAvatarSvg } from '../utils/avatars';
import { Trophy, Flame, Zap } from 'lucide-react';

export const LeaderboardPreview: React.FC = () => {
  const { roomState } = useSocket();

  if (!roomState || !roomState.players) return null;

  // Sort players by score
  const players = Object.values(roomState.players).sort((a, b) => b.score - a.score);

  return (
    <div className="glass-panel p-5 rounded-2xl border border-purple-500/20 bg-zinc-950/40">
      <h3 className="text-sm font-semibold text-zinc-400 mb-4 tracking-wider uppercase flex items-center gap-2">
        <Trophy size={16} className="text-yellow-500" />
        LIVE LEADERBOARD
      </h3>

      <div className="space-y-3">
        {players.map((player, index) => {
          const rank = index + 1;
          const isWinner = rank === 1;
          const isRunnerUp = rank === 2 || rank === 3;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                isWinner
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : isRunnerUp
                  ? 'bg-zinc-800/40 border-zinc-700/30'
                  : 'bg-zinc-950/60 border-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Rank number badge */}
                <span
                  className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                    isWinner
                      ? 'bg-yellow-500 text-zinc-950'
                      : rank === 2
                      ? 'bg-zinc-300 text-zinc-950'
                      : rank === 3
                      ? 'bg-amber-600 text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {rank}
                </span>

                {/* Avatar */}
                <div
                  dangerouslySetInnerHTML={{ __html: getAvatarSvg(player.avatarUrl, 32) }}
                  className="w-8 h-8 rounded-full bg-zinc-800/80 p-0.5 overflow-hidden flex items-center justify-center"
                />

                {/* Name & Host/Team Indicator */}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-200 truncate max-w-[120px]">
                    {player.username}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {player.isHost && (
                      <span className="text-[9px] px-1 bg-purple-500/20 text-purple-300 rounded font-semibold">
                        HOST
                      </span>
                    )}
                    {player.team && (
                      <span
                        className={`text-[9px] px-1.5 rounded font-semibold ${
                          player.team === 'Red'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {player.team.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Score and Streak */}
              <div className="flex items-center gap-3">
                {player.streak >= 3 && (
                  <div className="flex items-center text-orange-400 text-xs font-bold animate-pulse" title={`${player.streak} Streak!`}>
                    <Flame size={14} fill="#fb923c" className="mr-0.5" />
                    <span>{player.streak}</span>
                  </div>
                )}
                
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-purple-400">{player.score} pts</span>
                  {player.totalAnswers > 0 && (
                    <span className="text-[10px] text-zinc-500">
                      {Math.round((player.correctAnswers / player.totalAnswers) * 100)}% Acc
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeaderboardPreview;
