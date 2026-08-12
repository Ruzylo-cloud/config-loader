import * as fs from 'fs';
import * as path from 'path';

export interface ConfigLoaderOptions {
  /**
   * Path to a JSON config file. Missing file is silently ignored.
   * Loaded with lowest precedence (env vars override).
   */
  filePath?: string;
  /**
   * Prefix for environment variables to load (e.g., 'APP_').
   * APP_DB_HOST becomes db.host after lowercasing and dot expansion.
   * Defaults to no prefix (all env vars considered).
   */
  envPrefix?: string;
  /**
   * Default values object (lowest precedence).
   */
  defaults?: Record<string, any>;
}

function getDotPath(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

function setDotPath(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

function loadJsonFile(filePath: string): Record<string, any> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    // File doesn't exist or is invalid JSON; silently ignore
    return {};
  }
}

function coerceEnvValue(value: string): any {
  // Try to parse as boolean
  if (value === 'true') return true;
  if (value === 'false') return false;
  // Try to parse as number
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') return num;
  // Return as string
  return value;
}

function flattenEnvVars(prefix?: string): Record<string, any> {
  const result: Record<string, any> = {};
  const prefixToUse = prefix ? prefix.toUpperCase() : '';

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value !== 'string') continue;

    if (prefixToUse && !key.startsWith(prefixToUse)) continue;

    // Remove prefix and convert to dot notation
    let configKey = prefixToUse ? key.slice(prefixToUse.length) : key;

    // Convert SCREAMING_SNAKE_CASE to dot.path.notation (lowercase)
    // APP_DB_HOST -> db.host
    configKey = configKey
      .split('_')
      .filter(Boolean)
      .join('.')
      .toLowerCase();

    result[configKey] = coerceEnvValue(value);
  }

  return result;
}

export class ConfigLoader {
  private config: Record<string, any> = {};

  /**
   * Create a new ConfigLoader with layered configuration.
   * Precedence (highest to lowest): env vars → JSON file → defaults
   */
  constructor(options: ConfigLoaderOptions = {}) {
    // Layer 1: defaults (lowest precedence)
    if (options.defaults) {
      this.config = JSON.parse(JSON.stringify(options.defaults));
    }

    // Layer 2: JSON file
    if (options.filePath) {
      const fileConfig = loadJsonFile(options.filePath);
      for (const [key, value] of Object.entries(fileConfig)) {
        setDotPath(this.config, key, value);
      }
    }

    // Layer 3: environment variables (highest precedence)
    const envVars = flattenEnvVars(options.envPrefix);
    for (const [key, value] of Object.entries(envVars)) {
      setDotPath(this.config, key, value);
    }
  }

  /**
   * Get a configuration value using dot-path notation.
   * @param path Dot-separated path (e.g., 'database.host')
   * @param defaultValue Value to return if not found
   */
  get<T = any>(path: string, defaultValue?: T): T | undefined {
    const value = getDotPath(this.config, path);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Get a configuration value. Throw if missing.
   * @param path Dot-separated path (e.g., 'database.host')
   * @throws Error listing all missing required keys
   */
  required(keys: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    const missing: string[] = [];

    for (const key of keys) {
      const value = getDotPath(this.config, key);
      if (value === undefined) {
        missing.push(key);
      } else {
        result[key] = value;
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing required configuration keys: ${missing.join(', ')}`
      );
    }

    return result;
  }

  /**
   * Get entire configuration as a plain object.
   */
  getAll(): Record<string, any> {
    return JSON.parse(JSON.stringify(this.config));
  }
}
