'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Cloud, CloudRain, CloudSnow, CloudFog, Wind, Loader2 } from 'lucide-react';

interface WelcomeSplashProps {
  userName: string;
  onComplete: () => void;
}

type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'foggy' | 'windy';

interface WeatherInfo {
  type: WeatherType;
  temp: number;
  description: string;
}

const WEATHER_ICONS: Record<WeatherType, React.ReactNode> = {
  sunny: <Sun className="w-16 h-16 text-yellow-400" />,
  cloudy: <Cloud className="w-16 h-16 text-gray-400" />,
  rainy: <CloudRain className="w-16 h-16 text-blue-400" />,
  snowy: <CloudSnow className="w-16 h-16 text-blue-200" />,
  foggy: <CloudFog className="w-16 h-16 text-gray-300" />,
  windy: <Wind className="w-16 h-16 text-teal-400" />,
};

const WEATHER_MESSAGES: Record<WeatherType, string[]> = {
  sunny: [
    '날씨가 화창해요! 오늘도 화이팅하세요 ☀️',
    '맑은 하늘처럼 기분 좋은 하루 되세요!',
    '햇살 가득한 하루, 좋은 일만 가득하길!',
  ],
  cloudy: [
    '구름이 많지만 마음은 맑게! 💪',
    '흐린 날씨에도 당신의 미소는 빛나요!',
    '구름 사이로 햇살이 비출 거예요!',
  ],
  rainy: [
    '비가 와요! 우산 챙기셨나요? ☔',
    '비 오는 날, 안전 운전하세요!',
    '촉촉한 비가 내리네요. 따뜻한 차 한잔 어때요?',
  ],
  snowy: [
    '눈이 와요! 어서 퇴근해야 할 것 같아요 ❄️',
    '하얀 눈이 내려요. 미끄럼 조심하세요!',
    '눈 오는 날, 따뜻하게 입고 다니세요!',
  ],
  foggy: [
    '안개가 자욱해요. 운전 조심하세요! 🌫️',
    '안개 낀 날, 시야 확보에 주의하세요!',
    '안개 속에서도 당신의 길을 찾으세요!',
  ],
  windy: [
    '바람이 많이 불어요. 외출 시 주의하세요! 🍃',
    '바람 부는 날, 머리카락 날림 주의!',
    '시원한 바람과 함께 상쾌한 하루 되세요!',
  ],
};

const GREETINGS = [
  '좋은 아침이에요!',
  '좋은 하루 되세요!',
  '반가워요!',
  '오늘도 힘내세요!',
  '화이팅!',
];

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '좋은 아침이에요!';
  if (hour >= 12 && hour < 18) return '좋은 오후에요!';
  if (hour >= 18 && hour < 22) return '좋은 저녁이에요!';
  return '늦은 시간까지 수고하세요!';
}

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// 실제 날씨 API 대신 시뮬레이션 (실제 구현 시 OpenWeatherMap 등 사용)
function simulateWeather(): WeatherInfo {
  const month = new Date().getMonth() + 1;
  const random = Math.random();
  
  // 계절에 따른 날씨 확률 조정
  if (month >= 12 || month <= 2) {
    // 겨울
    if (random < 0.3) return { type: 'snowy', temp: -5 + Math.floor(Math.random() * 10), description: '눈' };
    if (random < 0.6) return { type: 'cloudy', temp: -2 + Math.floor(Math.random() * 8), description: '흐림' };
    return { type: 'sunny', temp: 0 + Math.floor(Math.random() * 10), description: '맑음' };
  } else if (month >= 3 && month <= 5) {
    // 봄
    if (random < 0.2) return { type: 'rainy', temp: 10 + Math.floor(Math.random() * 10), description: '비' };
    if (random < 0.4) return { type: 'cloudy', temp: 12 + Math.floor(Math.random() * 10), description: '흐림' };
    if (random < 0.5) return { type: 'windy', temp: 15 + Math.floor(Math.random() * 8), description: '바람' };
    return { type: 'sunny', temp: 15 + Math.floor(Math.random() * 10), description: '맑음' };
  } else if (month >= 6 && month <= 8) {
    // 여름
    if (random < 0.4) return { type: 'rainy', temp: 25 + Math.floor(Math.random() * 8), description: '비' };
    if (random < 0.5) return { type: 'cloudy', temp: 28 + Math.floor(Math.random() * 5), description: '흐림' };
    return { type: 'sunny', temp: 28 + Math.floor(Math.random() * 7), description: '맑음' };
  } else {
    // 가을
    if (random < 0.2) return { type: 'rainy', temp: 12 + Math.floor(Math.random() * 10), description: '비' };
    if (random < 0.3) return { type: 'foggy', temp: 10 + Math.floor(Math.random() * 8), description: '안개' };
    if (random < 0.5) return { type: 'cloudy', temp: 15 + Math.floor(Math.random() * 8), description: '흐림' };
    return { type: 'sunny', temp: 15 + Math.floor(Math.random() * 10), description: '맑음' };
  }
}

export default function WelcomeSplash({ userName, onComplete }: WelcomeSplashProps) {
  const [step, setStep] = useState(0);
  const [weather] = useState<WeatherInfo>(() => simulateWeather());
  const [greeting] = useState(() => getTimeBasedGreeting());
  const [weatherMessage] = useState(() => getRandomMessage(WEATHER_MESSAGES[weather.type]));

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    // Step 1: 인사 (1.5초 후 다음)
    timers.push(setTimeout(() => setStep(1), 100));
    timers.push(setTimeout(() => setStep(2), 1800));
    timers.push(setTimeout(() => setStep(3), 3500));
    timers.push(setTimeout(() => onComplete(), 5500));
    
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.5 } },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0, 0, 0.2, 1] as const } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4 } },
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.5, 
        type: 'spring' as const,
        stiffness: 200,
      } 
    },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center text-white px-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/20 flex items-center justify-center"
              >
                <span className="text-4xl">👋</span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold">
                안녕하세요
              </h1>
              <p className="text-2xl md:text-3xl font-medium text-white/90">
                {userName}님
              </p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                className="text-6xl mb-6"
              >
                ✨
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold">
                {greeting}
              </h1>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              <motion.div
                variants={iconVariants}
                initial="hidden"
                animate="visible"
                className="flex justify-center mb-4"
              >
                {WEATHER_ICONS[weather.type]}
              </motion.div>
              <div className="space-y-2">
                <p className="text-xl text-white/80">
                  오늘의 날씨: {weather.description} {weather.temp}°C
                </p>
                <h1 className="text-2xl md:text-3xl font-bold leading-relaxed">
                  {weatherMessage}
                </h1>
              </div>
            </motion.div>
          )}

          {step === 0 && (
            <motion.div
              key="loading"
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-white/80" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 진행 표시 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {[1, 2, 3].map((s) => (
            <motion.div
              key={s}
              className={`w-2 h-2 rounded-full ${step >= s ? 'bg-white' : 'bg-white/30'}`}
              initial={{ scale: 0.8 }}
              animate={{ scale: step === s ? 1.2 : 1 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
