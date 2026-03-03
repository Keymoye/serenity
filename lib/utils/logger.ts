type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  correlationId?: string;
  [key: string]: unknown;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext) {
  const base = `[${level.toUpperCase()}] ${message}`;
  if (!context || Object.keys(context).length === 0) return base;
  return `${base} | ${JSON.stringify(context)}`;
}

interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: unknown, context?: LogContext): void;
  withContext(baseContext: LogContext): Logger;
}

function createLogger(baseContext: LogContext = {}): Logger {
  return {
    debug(message, context) {
      if (process.env.NODE_ENV !== "production") {
        console.debug(
          formatMessage("debug", message, { ...baseContext, ...context }),
        );
      }
    },

    info(message, context) {
      console.info(
        formatMessage("info", message, { ...baseContext, ...context }),
      );
    },

    warn(message, context) {
      console.warn(
        formatMessage("warn", message, { ...baseContext, ...context }),
      );
    },

    error(message, error, context) {
      const mergedContext: LogContext = {
        ...baseContext,
        ...context,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      };
      console.error(formatMessage("error", message, mergedContext));
    },

    withContext(extraContext: LogContext): Logger {
      return createLogger({ ...baseContext, ...extraContext });
    },
  };
}

export const logger: Logger = createLogger();

