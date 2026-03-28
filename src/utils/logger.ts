export type LogLevel = "error" | "warn" | "info" | "debug";

let logLevel: LogLevel = "info";

export function setLogLevel(level: LogLevel): void {
  logLevel = level;
}

export function debug(...args: unknown[]): void {
  if (logLevel === "debug") {
    console.debug(...args);
  }
}

export function info(...args: unknown[]): void {
  if (logLevel === "info" || logLevel === "debug") {
    console.log(...args);
  }
}

export function warn(...args: unknown[]): void {
  if (logLevel === "warn" || logLevel === "info" || logLevel === "debug") {
    console.warn(...args);
  }
}

export function error(...args: unknown[]): void {
  console.error(...args);
}

export function getLogLevel(): LogLevel {
  return logLevel;
}
