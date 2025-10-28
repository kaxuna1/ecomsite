import app from './app';
import { env } from './config/env';

app.listen(env.port, () => {
  console.log(`Luxia backend listening on port ${env.port}`);
});
