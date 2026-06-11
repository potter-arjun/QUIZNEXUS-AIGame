'use client';

import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { getAvatarSvg } from '../utils/avatars';
import ChatBox from './ChatBox';
import { 
  Crown, Play, CheckCircle2, XCircle, Copy, 
  ArrowLeft, Share2, Users, Settings
} from 'lucide-react';

export const LobbyView: React.FC = () => {
  const { user } = useAuth();
  const { roomState, leaveRoom, toggleReady, switchTeam, startGame, gamePreparing } = useSocket();

  if (!roomState) return null;

  const players = Object.values(roomState.players);
  const me = roomState.players[Object.keys(roomState.players).find(id => roomState.players[id].userId === user?.id) || ''];
  const isHost = me?.isHost;

  // Check if everyone (except host) is ready
  const allReady = players.filter(p => !p.isHost).every(p => p.isReady);
  const canStart = isHost && players.length >= 1 && allReady; // Allow solo start for testing

  const copyCode = () => {
    navigator.clipboard.writeText(roomState.code);
    alert("Room code copied to clipboard!");
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}?room=${roomState.code}`;
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied to clipboard!");
  };

  if (gamePreparing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4">
        {/* Spinning orb */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-purple-600/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-pink-500 border-b-transparent border-l-transparent animate-spin" />
          <div className="absolute inset-3 rounded-full border-2 border-t-transparent border-r-transparent border-b-cyan-400 border-l-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }} />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-zinc-100 uppercase tracking-tight animate-pulse">
            AI is Crafting Your Battle
          </h2>
          <p className="text-zinc-500 text-sm">Generating unique questions — won't be long...</p>
        </div>

        {/* Animated step checklist */}
        <div className="space-y-3 w-full max-w-xs">
          {[
            { label: 'Connecting to AI engine', delay: '0s' },
            { label: 'Generating unique questions', delay: '0.4s' },
            { label: 'Filtering seen questions', delay: '0.8s' },
            { label: 'Preparing arena...', delay: '1.2s' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3 animate-step-in opacity-0" style={{ animationDelay: step.delay, animationFillMode: 'forwards' }}>
              <div className="w-5 h-5 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin shrink-0" style={{ animationDuration: `${1 + i * 0.3}s` }} />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* Lobby Header Grid */}
      <div className="glass-panel p-6 rounded-3xl bg-zinc-950/40 border-purple-500/20 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-600 text-purple-100 uppercase tracking-wide">
                {roomState.mode} Battle
              </span>
              <span className="text-zinc-500 text-xs font-bold">•</span>
              <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Settings size={12} /> {roomState.difficulty} | {roomState.language === 'en' ? 'English' : roomState.language === 'hi' ? 'Hindi' : 'Bilingual'} | {roomState.questionCount} Questions
              </span>
            </div>
            
            <h2 className="text-2xl font-black text-zinc-100 tracking-tight mt-1 uppercase">
              BATTLEFIELD STAGING LOBBY
            </h2>
          </div>

          {/* Room Code Display */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Lobby Code</span>
              <span className="font-mono text-2xl font-black tracking-widest text-purple-400">{roomState.code}</span>
            </div>
            <button
              onClick={copyCode}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all cursor-pointer"
              title="Copy Code"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={copyInviteLink}
              className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600 hover:text-white transition-all cursor-pointer"
              title="Copy Invite Link"
            >
              <Share2 size={16} />
            </button>
          </div>

        </div>
      </div>

      {/* Main Grid: Player List vs Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Area: Players list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl bg-zinc-950/30 min-h-[350px] flex flex-col">
            <h3 className="text-sm font-bold tracking-wider text-zinc-400 border-b border-zinc-900 pb-3 mb-5 uppercase flex items-center gap-2">
              <Users size={16} className="text-purple-400" />
              Connected Competitors ({players.length}/{roomState.maxPlayers})
            </h3>

            {/* Players Grid list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`p-3 rounded-2xl border bg-zinc-950/60 flex items-center justify-between transition-all duration-300 ${
                    player.isReady
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      dangerouslySetInnerHTML={{ __html: getAvatarSvg(player.avatarUrl, 42) }}
                      className="w-10 h-10 rounded-xl bg-zinc-800 p-0.5 flex items-center justify-center shrink-0"
                    />

                    {/* Meta info */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-zinc-200 truncate max-w-[120px]">{player.username}</span>
                        {player.isHost && (
                          <Crown size={13} className="text-yellow-500 fill-yellow-500/20" />
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">
                        {roomState.mode === 'team' ? `${player.team} Team` : player.isHost ? 'Host Manager' : 'Challenger'}
                      </span>
                    </div>
                  </div>

                  {/* Ready indicator/Selector */}
                  <div className="flex items-center gap-2">
                    {player.isReady ? (
                      <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 size={14} className="fill-emerald-500/10" /> Ready
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-xs font-semibold flex items-center gap-1">
                        <XCircle size={14} /> Waiting
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Team Selectors & Game Actions */}
            <div className="border-t border-zinc-900 pt-6 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              {/* Team Switcher */}
              {roomState.mode === 'team' && me && (
                <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => switchTeam('Red')}
                    className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer ${
                      me.team === 'Red' ? 'bg-red-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Red Team
                  </button>
                  <button
                    onClick={() => switchTeam('Blue')}
                    className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer ${
                      me.team === 'Blue' ? 'bg-blue-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Blue Team
                  </button>
                </div>
              )}
              {roomState.mode !== 'team' && <div />}

              {/* Ready Toggles & Starts */}
              <div className="flex gap-3">
                {!isHost && (
                  <button
                    onClick={toggleReady}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                      me?.isReady
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                        : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/10'
                    }`}
                  >
                    {me?.isReady ? "CANCEL READY" : "IM READY"}
                  </button>
                )}

                {isHost && (
                  <button
                    onClick={startGame}
                    disabled={!canStart}
                    className={`px-7 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg ${
                      canStart
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25 active:scale-95 animate-start-pulse'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-900 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Play size={14} fill="currentColor" /> START MATCH
                    {canStart && <span className="ml-1 text-purple-200 animate-pulse">●</span>}
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Right Area: Chat box */}
        <div className="lg:col-span-1">
          <ChatBox roomCode={roomState.code} />
        </div>

      </div>

      {/* Exit Button */}
      <div className="mt-8 flex justify-start">
        <button
          onClick={leaveRoom}
          className="px-5 py-2.5 rounded-xl border border-zinc-900 hover:border-zinc-800 bg-zinc-950/20 text-zinc-400 hover:text-zinc-100 transition-all flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider"
        >
          <ArrowLeft size={14} /> Leave Lobby
        </button>
      </div>

    </div>
  );
};

export default LobbyView;
