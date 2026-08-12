# Config Loader

Hierarchical config management (env → file → defaults). For Ferrow deployments.

```javascript
const config = new ConfigLoader();
const port = config.get('port', 3000);
```

## Features
- ✓ Environment override
- ✓ Schema validation
- ✓ Env file support
- ✓ Ferrow deployment config

## License: MIT
