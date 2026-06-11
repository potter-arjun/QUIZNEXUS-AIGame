'use client';

import React from 'react';
import { AVATAR_LIST, getAvatarSvg } from '../utils/avatars';

interface AvatarSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  size?: number;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({ selectedId, onSelect, size = 60 }) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center py-4">
      {AVATAR_LIST.map((avatar) => {
        const isSelected = selectedId === avatar.id;
        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onSelect(avatar.id)}
            className={`p-2 rounded-xl transition-all duration-200 transform hover:scale-110 cursor-pointer ${
              isSelected
                ? 'bg-purple-900/50 border-2 border-purple-500 scale-105 shadow-lg shadow-purple-500/30'
                : 'bg-zinc-900/40 border-2 border-zinc-800 hover:border-purple-500/50'
            }`}
            title={avatar.name}
          >
            <div
              dangerouslySetInnerHTML={{ __html: getAvatarSvg(avatar.id, size) }}
              className="w-full h-full"
            />
          </button>
        );
      })}
    </div>
  );
};

export default AvatarSelector;
