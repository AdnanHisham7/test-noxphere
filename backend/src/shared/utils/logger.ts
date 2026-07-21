import winston from "winston";

const isProduction = process.env.NODE_ENV === "production";

export const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",

  format: winston.format.combine(
    winston.format.timestamp(),

    ...(isProduction ? [] : [winston.format.colorize()]),

    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      const metaStr =
        Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta, null, 2)}` : "";

      return `[${timestamp}] ${level}: ${message}${metaStr}`;
    }),
  ),

  transports: [
    new winston.transports.Console(),

    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),

    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});
