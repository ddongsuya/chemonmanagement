'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface WelcomeSplashProps {
  userName: string;
  onComplete: () => void;
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '좋은 아침이에요';
  if (hour >= 12 && hour < 18) return '좋은 오후에요';
  if (hour >= 18 && hour < 22) return '좋은 저녁이에요';
  return '늦은 시간까지 수고하세요';
}

export default function WelcomeSplash({ userName, onComplete }: WelcomeSplashProps) {
  const greeting = getTimeBasedGreeting();

  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-primary"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center text-white px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <p className="text-lg text-white/70 mb-1">{greeting}</p>
          <h1 className="text-2xl font-semibold">
            {userName}님
          </h1>
        </motion.div>
      </div>
    </motion.div>
  );
}
