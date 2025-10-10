import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Create a log directory path
const logDir = path.join(process.cwd(), 'logs');

const { combine, timestamp, errors, json, printf, colorize, cli } = winston.format;

// Custom format for console (non-JSON, colored)
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] ${level}: ${stack || message}`;
});

export const logger = winston.createLogger({
  // Use environment variable for flexible level control :cite[1]
  level: process.env.LOG_LEVEL || 'info',
  handleExceptions: true,
  handleRejections: true,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Log full stack traces
    json() 
  ),
  transports: [
    // Console transport - for development, more readable
    new winston.transports.Console({
      format: combine(
        colorize(), // Adds colors to levels
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    }),

    // Daily Rotate File for all logs
    new DailyRotateFile({
      filename: path.join(logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      // No level set, so it logs everything the logger allows
    }),

    // Daily Rotate File specifically for errors
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error', // Only logs 'error' level and above
    }),
  ],
});

// Optional: Handle events from the daily rotate file transport :cite[2]
const dailyRotateTransport = logger.transports.find(transport => transport instanceof DailyRotateFile) as DailyRotateFile;

if (dailyRotateTransport) {
  dailyRotateTransport.on('error', (error) => {
    logger.error('DailyRotateFile transport error:', error);
  });
  dailyRotateTransport.on('rotate', (oldFilename, newFilename) => {
    logger.info(`Log file rotated from ${oldFilename} to ${newFilename}`);
  });
}