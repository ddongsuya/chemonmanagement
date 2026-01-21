/**
 * 간단한 로깅 유틸리티
 * 프로덕션에서는 winston/pino로 교체 권장
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
}

function formatLog(entry: LogEntry): string {
  const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`;
}

function createLogEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      console.debug(formatLog(createLogEntry('debug', message, context)));
    }
  },

  info(message: string, context?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      console.info(formatLog(createLogEntry('info', message, context)));
    }
  },

  warn(message: string, context?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      console.warn(formatLog(createLogEntry('warn', message, context)));
    }
  },

  error(message: string, context?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      const entry = createLogEntry('error', message, context);
      console.error(formatLog(entry));
      
      // 프로덕션에서는 여기에 외부 로깅 서비스 연동 가능
      // 예: Sentry, LogRocket, CloudWatch 등
    }
  },

  // HTTP 요청 로깅용
  request(method: string, path: string, statusCode: number, duration: number, context?: Record<string, unknown>): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this[level](`${method} ${path} ${statusCode} ${duration}ms`, context);
  },
};

export default logger;
