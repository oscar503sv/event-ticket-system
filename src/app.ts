import { logger } from './config/logger';
import { createServer } from './config/server';

async function bootstrap() {
// Crear servidor
const app = createServer();

 // Iniciar servidor
 const port = Number(process.env.PORT || 3000);
 app.listen(port, () => {
   logger.info(`Servidor iniciado en puerto ${port}`);
   logger.info(`Documentación API disponible en http://localhost:${port}/swagger`);
 });
 
 return app;
}

// Iniciar la aplicación
bootstrap()
  .catch((error) => {
    logger.error('Error al iniciar la aplicación:', error);
    process.exit(1);
  });