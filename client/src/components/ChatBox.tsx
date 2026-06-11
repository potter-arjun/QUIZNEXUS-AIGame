'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Send } from 'lucide-react';

interface ChatBoxProps {
  roomCode: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ roomCode }) => {
  const { chatMessages, sendChat } = useSocket();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendChat(messageText.trim());
    setMessageText('');
  };

  return (
    <div className="flex flex-col h-[380px] rounded-2xl border border-purple-500/20 bg-zinc-950/80 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-900/90 border-b border-purple-500/10">
        <h3 className="text-sm font-semibold text-purple-400 tracking-wide">ROOM CHAT ARENA</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {chatMessages.length === 0 ? (
          <div className="text-center text-xs text-zinc-500 mt-10">
            No messages yet. Say hello to start the battle!
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            const isSystem = msg.sender === 'System';
            const isMe = user && msg.sender === user.username;

            if (isSystem) {
              return (
                <div key={index} className="text-center text-[11px] italic text-purple-400/80 py-1">
                  {msg.message}
                </div>
              );
            }

            return (
              <div
                key={index}
                className={`flex flex-col max-w-[85%] ${
                  isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <span className="text-[10px] text-zinc-500 mb-0.5 px-1">{msg.sender}</span>
                <div
                  className={`px-3 py-2 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : 'bg-zinc-800 text-zinc-200 rounded-tl-none'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-zinc-900/60 border-t border-purple-500/10 flex gap-2">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 text-sm rounded-xl bg-zinc-950 border border-zinc-800 focus:outline-none focus:border-purple-500/60 text-zinc-100 placeholder-zinc-500"
        />
        <button
          type="submit"
          className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
