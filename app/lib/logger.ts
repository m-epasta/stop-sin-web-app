import { createLogger, format, transports } from 'winston';
import path from 'path';

const { combine, timestamp, errors, json, printf, colorize } = format;

const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] ${level}: ${stack || message}`;
});

// Create absolute paths for all the log levels
const infoLogPath = path.join(process.cwd(), 'logs/app-info.log');
const warnLogPath = path.join(process.cwd(), 'logs/app-warn.log');
const errorLogPath = path.join(process.cwd(), 'logs/app-error.log');
const combinedLogPath = path.join(process.cwd(), 'logs/app-combined.log');
const debugLogPath = path.join(process.cwd(), 'logs/app-debug.log');

export const logger = createLogger({
  level: 'debug', // Global minimum level
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  transports: [
    // Console transport - colored and formatted
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
      level: 'debug' // Show all levels in console
    }),

    // Debug level - everything
    new transports.File({
      filename: debugLogPath,
      level: 'debug', // Captures debug, info, warn, error
      format: combine(
        timestamp(),
        json()
      )
    }),

    // Info level - info and above (info, warn, error)
    new transports.File({
      filename: infoLogPath,
      level: 'info',
      format: combine(
        timestamp(),
        json()
      )
    }),

    // Warn level - warn and above (warn, error)
    new transports.File({
      filename: warnLogPath,
      level: 'warn',
      format: combine(
        timestamp(),
        json()
      )
    }),

    // Error level - only errors
    new transports.File({
      filename: errorLogPath,
      level: 'error',
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      )
    }),

    // Combined - everything from info and above
    new transports.File({
      filename: combinedLogPath,
      level: 'info',
      format: combine(
        timestamp(),
        json()
      )
    })
  ]
});

// Test the logger on startup
logger.debug('Debug level test - working as expeected');
logger.info('Info level test - working as expeected');
logger.warn('Warn level test - working as expeected');
logger.error('Error level test - working as expeected');

logger.info(`Log files initialized at: ${path.join(process.cwd(), 'logs')}`);
