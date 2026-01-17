'use client';

import { useEffect, useState } from 'react';
import './ghost-overlay.css';

interface GhostState {
  suggestion: string;
  x: number;
  y: number;
  visible: boolean;
}

export default function GhostOverlayPage() {
  const [ghost, setGhost] = useState<GhostState>({
    suggestion: '',
    x: 0,
    y: 0,
    visible: false,
  });

  useEffect(() => {
    const handleUpdate = (...args: unknown[]) => {
      const data = args[1] as GhostState;
      if (data) setGhost(data);
    };

    const handlePosition = (...args: unknown[]) => {
      const pos = args[1] as { x: number; y: number };
      if (pos) setGhost(prev => ({ ...prev, x: pos.x, y: pos.y }));
    };

    const electron = typeof window !== 'undefined' ? window.electron : undefined;
    electron?.on?.('ghost-update', handleUpdate);
    electron?.on?.('ghost-position', handlePosition);

    return () => {
      electron?.removeListener?.('ghost-update', handleUpdate);
      electron?.removeListener?.('ghost-position', handlePosition);
    };
  }, []);

  if (!ghost.visible || !ghost.suggestion) {
    return null;
  }

  return (
    <div className="ghost-overlay-container">
      <span
        className="ghost-text"
        style={{
          left: ghost.x,
          top: ghost.y,
        }}
      >
        {ghost.suggestion}
      </span>
      
      <span
        className="ghost-hint"
        style={{
          left: ghost.x,
          top: ghost.y + 18,
        }}
      >
        Shift+Tab ↵
      </span>
    </div>
  );
}
