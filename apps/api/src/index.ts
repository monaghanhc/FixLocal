import 'dotenv/config';
import { app } from './app.js';
import { env } from './env.js';

const startServer = (port: number) => {
  const server = app.listen(port, () => {
    console.log(`FixLocal API listening on http://localhost:${port}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE' && env.NODE_ENV !== 'production') {
      const fallbackPort = port + 1;
      console.warn(`Port ${port} is already in use. Retrying on ${fallbackPort}...`);
      startServer(fallbackPort);
      return;
    }

    throw error;
  });
};

startServer(env.PORT);
