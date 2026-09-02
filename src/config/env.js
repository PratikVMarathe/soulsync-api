import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

/**
 * Loads the appropriate environment file based on runtime configuration.
 *
 * Priority:
 * 1. DOTENV_CONFIG_PATH environment variable (if specified)
 * 2. .env.local (for local development, if present)
 * 3. .env.dev (for dev branch / staging deployment, if present)
 * 4. .env (default fallback)
 */
function loadEnvironment() {
  const customEnvPath = process.env.DOTENV_CONFIG_PATH;

  if (customEnvPath && fs.existsSync(customEnvPath)) {
    dotenv.config({ path: customEnvPath });
    return;
  }

  if (process.env.APP_ENV === 'dev' && fs.existsSync('.env.dev')) {
    dotenv.config({ path: '.env.dev' });
    return;
  }

  if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
    return;
  }

  if (fs.existsSync('.env.dev')) {
    dotenv.config({ path: '.env.dev' });
    return;
  }

  dotenv.config();
}

loadEnvironment();

export default process.env;
