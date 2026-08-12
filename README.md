# config-loader

Layered configuration loader supporting JSON files and environment variables with dot-path access. Precedence: environment variables override JSON file values, which override defaults.

## Installation

```bash
npm install config-loader
```

## Quick Start

```javascript
import { ConfigLoader } from 'config-loader';

// Layer 1: defaults (lowest)
// Layer 2: JSON file (app.json)
// Layer 3: env vars (highest, with APP_ prefix)
const config = new ConfigLoader({
  defaults: {
    port: 3000,
    database: { host: 'localhost', port: 5432 }
  },
  filePath: './app.json',
  envPrefix: 'APP_'
});

const port = config.get('port'); // from env, JSON file, or default
const dbHost = config.get('database.host');
```

## API

### `new ConfigLoader(options?): ConfigLoader`

**Options:**
- `defaults`: Default values (Record<string, any>, optional)
- `filePath`: Path to JSON config file (string, optional; missing file is silently ignored)
- `envPrefix`: Prefix for env vars to load (string, optional; e.g., 'APP_')

**Precedence (highest to lowest):**
1. Environment variables (if prefix matches)
2. JSON file values
3. Defaults

### `config.get<T>(path, defaultValue?): T`

Get a value using dot-path notation (e.g., `'database.host'`).

```javascript
config.get('database.host');        // returns undefined if not found
config.get('database.host', 'localhost'); // returns default if not found
```

### `config.required(keys: string[]): Record<string, any>`

Get multiple values. Throws if any key is missing.

```javascript
const { db_host, db_port } = config.required(['database.host', 'database.port']);
// Throws: "Missing required configuration keys: database.port"
```

### `config.getAll(): Record<string, any>`

Get entire configuration as a plain object.

## Environment Variables

Variables are mapped using a prefix and underscore-to-dot conversion:

| Env Var | Prefix | Becomes |
|---------|--------|---------|
| `APP_PORT` | `APP_` | `port` |
| `APP_DB_HOST` | `APP_` | `db.host` |
| `APP_DB_POOL_MAX` | `APP_` | `db.pool.max` |

Variable names are lowercased. Values are coerced:
- `'true'` → `true` (boolean)
- `'false'` → `false` (boolean)
- Numeric strings → numbers
- Others → strings as-is

### Without prefix

```javascript
const config = new ConfigLoader(); // All env vars loaded, lowercased
config.get('node_env'); // from NODE_ENV env var
```

## Examples

### All three layers

```javascript
// app.json
{
  "port": 3000,
  "database": {
    "host": "localhost",
    "pool": { "max": 10 }
  }
}
```

```javascript
process.env.APP_PORT = '8080';
process.env.APP_DB_POOL_MAX = '20';

const config = new ConfigLoader({
  defaults: { debug: false },
  filePath: './app.json',
  envPrefix: 'APP_'
});

config.get('port');              // 8080 (from env, overrides 3000 from file)
config.get('database.host');     // 'localhost' (from file, no env override)
config.get('database.pool.max'); // 20 (from env, overrides 10 from file)
config.get('debug');             // false (from defaults)
```

## Limits

- Missing JSON files are silently ignored; use `filePath` only for optional config files.
- Returned values are mutable; do not modify them if immutability is required.
- No circular reference detection for defaults or file content.
- Environment variable values are strings until coerced; custom types require manual conversion after `.get()`.
- No hot-reload; configuration is read once at instantiation.

## License: MIT

Sponsored by [Ferrow](https://ferrow.ai)

---
Part of the [ferrow-toolkit](https://github.com/FerrowAI/ferrow-toolkit) collection · Sponsored by [Ferrow](https://ferrow.ai)
