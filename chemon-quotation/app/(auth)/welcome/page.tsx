'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudFog, CloudLightning, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface WeatherData {
  temp: number;
  code: number;
  description: string;
  icon: React.ReactNode;
  message: string;
}

function parseWeatherCode(code: number, temp: number): { description: string; icon: React.ReactNode; message: string } {
  const iconClass = 'w-8 h-8';

  if (code === 0 || code === 1) {
    return {
      description: '맑음',
      icon: <Sun className={`${iconClass} text-amber-400`} />,
      message: temp > 25 ? '맑고 더운 날이에요. 수분 보충 잊지 마세요.' : '맑은 하루, 기분 좋은 하루 되세요.',
    };
  }
  if (code === 2 || code === 3) {
    return {
      description: code === 2 ? '구름 조금' : '흐림',
      icon: <Cloud className={`${iconClass} text-slate-400`} />,
      message: '구름이 있지만 나쁘지 않은 날씨예요.',
    };
  }
  if (code === 45 || code === 48) {
    return {
      description: '안개',
      icon: <CloudFog className={`${iconClass} text-slate-300`} />,
      message: '안개가 있어요. 운전 시 주의하세요.',
    };
  }
  if (code >= 51 && code <= 57) {
    return {
      description: '이슬비',
      icon: <CloudDrizzle className={`${iconClass} text-blue-300`} />,
      message: '가벼운 비가 내려요. 우산 챙기세요.',
    };
  }
  if (code >= 61 && code <= 67) {
    return {
      description: '비',
      icon: <CloudRain className={`${iconClass} text-blue-400`} />,
      message: '비가 와요. 우산 꼭 챙기세요.',
    };
  }
  if (code >= 71 && code <= 77) {
    return {
      description: '눈',
      icon: <CloudSnow className={`${iconClass} text-sky-300`} />,
      message: '눈이 내려요. 미끄럼 조심하세요.',
    };
  }
  if (code >= 80 && code <= 82) {
    return {
      description: '소나기',
      icon: <CloudRain className={`${iconClass} text-blue-500`} />,
      message: '소나기가 예상돼요. 우산 준비하세요.',
    };
  }
  if (code >= 95) {
    return {
      description: '뇌우',
      icon: <CloudLightning className={`${iconClass} text-yellow-400`} />,
      message: '천둥번개가 있어요. 외출 시 주의하세요.',
    };
  }
  return {
    description: '흐림',
    icon: <Cloud className={`${iconClass} text-slate-400`} />,
    message: '오늘도 좋은 하루 되세요.',
  };
}


function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '늦은 밤이에요';
  if (hour < 12) return '좋은 아침이에요';
  if (hour < 18) return '좋은 오후예요';
  return '좋은 저녁이에요';
}

async function fetchWeather(): Promise<WeatherData | null> {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.978&current=temperature_2m,weather_code&timezone=Asia/Seoul'
    );
    if (!res.ok) return null;
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weather_code;
    const parsed = parseWeatherCode(code, temp);
    return { temp, code, ...parsed };
  } catch {
    return null;
  }
}

export default function WelcomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const { user } = useAuthStore();

  const [step, setStep] = useState(0); // 0: greeting, 1: weather, 2: redirect
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const greeting = getGreeting();
  const userName = user?.name || '사용자';

  // 날씨 데이터 가져오기
  useEffect(() => {
    fetchWeather().then((data) => {
      setWeather(data);
      setWeatherLoading(false);
    });
  }, []);

  // 애니메이션 스텝 진행
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // step 0 → 1 (인사 → 날씨): 1.5초
    timers.push(setTimeout(() => setStep(1), 1500));

    // step 1 → 2 (날씨 → 리다이렉트): 3.5초
    timers.push(
      setTimeout(() => {
        const redirectTo = returnUrl ? decodeURIComponent(returnUrl) : '/dashboard';
        router.push(redirectTo);
      }, 3500)
    );

    return () => timers.forEach(clearTimeout);
  }, [router, returnUrl]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="greeting"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <p className="text-muted-foreground text-sm">{greeting}</p>
              <h1 className="text-2xl font-semibold text-foreground">
                {userName}님, 안녕하세요
              </h1>
            </motion.div>
          )}

          {step >= 1 && (
            <motion.div
              key="weather"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-5"
            >
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">{greeting}</p>
                <h1 className="text-2xl font-semibold text-foreground">
                  {userName}님, 안녕하세요
                </h1>
              </div>

              {weatherLoading ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>날씨 확인 중...</span>
                </div>
              ) : weather ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="inline-flex flex-col items-center gap-3 px-6 py-4 rounded-xl bg-card border border-border shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    {weather.icon}
                    <div className="text-left">
                      <p className="text-lg font-medium text-foreground">
                        서울 {weather.temp}°C
                      </p>
                      <p className="text-sm text-muted-foreground">{weather.description}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{weather.message}</p>
                </motion.div>
              ) : (
                <p className="text-sm text-muted-foreground">오늘도 좋은 하루 되세요.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}