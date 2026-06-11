'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import AuthView from '../components/AuthView';
import DashboardView from '../components/DashboardView';
import LobbyView from '../components/LobbyView';
import ArenaView from '../components/ArenaView';
import WinnerView from '../components/WinnerView';

export default function Home() {
  const { user, loading } = useAuth();
  const { roomState, joinRoom } = useSocket();

  // Handle invite room code in URL (e.g. ?room=ABCD12)
  useEffect(() => {
    if (user && !roomState) {
      const params = new URLSearchParams(window.location.search);
      const roomCode = params.get('room');
      if (roomCode) {
        joinRoom(roomCode);
        // Clean up URL query parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [user, roomState, joinRoom]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#030014]">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">LOADING SESSION...</h2>
      </div>
    );
  }

  // 1. Session Auth onboarding
  if (!user) {
    return <AuthView />;
  }

  // 2. Room Lobby Staging
  if (roomState?.status === 'lobby') {
    return (
      <main className="flex-1 py-6">
        <LobbyView />
      </main>
    );
  }

  // 3. Quiz Arena Play
  if (roomState?.status === 'playing') {
    return (
      <main className="flex-1 py-6">
        <ArenaView />
      </main>
    );
  }

  // 4. Winner Podiums Celebration
  if (roomState?.status === 'ended') {
    return (
      <main className="flex-1 py-6">
        <WinnerView />
      </main>
    );
  }

  // 5. Default Games Dashboard
  return (
    <main className="flex-1 py-6">
      <DashboardView />
    </main>
  );
}

