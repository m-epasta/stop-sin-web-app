// lib/logger.ts - Temporary Debugging Configuration
import { createLogger, format, transports } from 'winston';
import path from 'path';

const { combine, timestamp, errors, json, printf, colorize } = format;

const detailedConsoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] ${level}: ${stack || message}`;
});

// Create an absolute path for a simple debug log
const simpleLogPath = path.join(process.cwd(), 'simple-debug.log');

export const logger = createLogger({
  level: 'debug',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  transports: [
    // Keep the detailed console
    new transports.Console({
      format: combine(colorize(), detailedConsoleFormat),
      level: 'debug',
    }),
    // Add a simple file transport to the project root
    new transports.File({ 
      filename: simpleLogPath,
      level: 'debug', // Log everything
    }),
  ],
});

// Log the log file path on startup
logger.info(`Simple debug log should be at: ${simpleLogPath}`);