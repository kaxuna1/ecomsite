import app from './app';
import { env } from './config/env';
import { runMigrations } from './scripts/migrate';
import { authService } from './services/authService';

const start = async () => {
  try {
    await runMigrations();
    await authService.ensureDefaultAdmin();
    app.listen(env.port, () => {
      console.log(`Luxia backend listening on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

start();
