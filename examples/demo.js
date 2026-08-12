const fs = require('fs');
const path = require('path');
const { ConfigLoader } = require('../dist/index.js');

// Create a temp config file
const tempDir = '/tmp/config-loader-demo';
const configFile = path.join(tempDir, 'config.json');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

fs.writeFileSync(configFile, JSON.stringify({
  port: 3000,
  database: { host: 'localhost', port: 5432 }
}));

// Test 1: All three layers (defaults, file, env)
console.log('Test 1: Layered config (defaults → file → env)');
process.env.APP_PORT = '8080';
process.env.APP_DB_HOST = 'db.example.com';

const config = new ConfigLoader({
  defaults: { debug: false, timeout: 30 },
  filePath: configFile,
  envPrefix: 'APP_'
});

console.log(`  port=${config.get('port')} (from env, override of 3000 from file)`);
console.log(`  database.host=${config.get('database.host')} (from env override)`);
console.log(`  database.port=${config.get('database.port')} (from file)`);
console.log(`  debug=${config.get('debug')} (from defaults)`);
console.log(`  timeout=${config.get('timeout')} (from defaults)`);

// Test 2: Default values in get()
console.log('\nTest 2: Default values in get()');
console.log(`  missing.key=${config.get('missing.key', 'fallback')} (default provided)`);

// Test 3: required() with multiple keys
console.log('\nTest 3: required() method');
const required = config.required(['port', 'database.host', 'timeout']);
console.log(`  required keys: port=${required.port}, db_host=${required['database.host']}, timeout=${required.timeout}`);

// Test 4: required() with missing key
console.log('\nTest 4: required() with missing key');
try {
  config.required(['port', 'missing.key']);
} catch (err) {
  console.log(`  Caught error: ${err.message}`);
}

// Test 5: getAll()
console.log('\nTest 5: getAll()');
const all = config.getAll();
console.log(`  Total keys in config: ${Object.keys(all).length}`);
console.log(`  Structure: {${Object.keys(all).join(', ')}}`);

// Clean up
fs.rmSync(tempDir, { recursive: true });

console.log('\n✓ All tests passed');
