let debugMode = false;

export function setDebug(enabled: boolean): void {
  debugMode = enabled;
}

export function debug(...args: unknown[]): void {
  if (debugMode) {
    console.debug(...args);
  }
}

export function info(...args: unknown[]): void {
  if (debugMode) {
    console.log(...args);
  }
}

export function warn(...args: unknown[]): void {
  if (debugMode) {
    console.warn(...args);
  }
}

export function error(...args: unknown[]): void {
  console.error(...args);
}

export function isDebug(): boolean {
  return debugMode;
}
