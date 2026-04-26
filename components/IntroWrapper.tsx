'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const IntroScreen = dynamic(() => import('./IntroScreen'), { ssr: false });

export default function IntroWrapper({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // only show intro once per session
    if (sessionStorage.getItem('intro_done')) setDone(true);
  }, []);

  function handleEnter() {
    sessionStorage.setItem('intro_done', '1');
    setDone(true);
  }

  if (!mounted) return null;

  return (
    <>
      {!done && <IntroScreen onEnter={handleEnter} />}
      <div style={{
        opacity: done ? 1 : 0,
        transition: 'opacity 0.6s ease 0.3s',
        visibility: done ? 'visible' : 'hidden',
      }}>
        {children}
      </div>
    </>
  );
}
