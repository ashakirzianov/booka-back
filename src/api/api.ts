import { SwaggerRouter } from 'koa-swagger-decorator';
import { JsonRouter, LibraryRouter } from './book';

export const apiRouter = new SwaggerRouter();

// swagger docs available at http://localhost:3042/swagger-html
apiRouter.swagger({
  title: 'Booka Back',
  description: 'Booka API',
  version: '1.0.0',

  swaggerHtmlEndpoint: '/swagger-html',
  swaggerJsonEndpoint: '/swagger-json',

  swaggerConfiguration: {
    display: {
      defaultModelsExpandDepth: 4,
      defaultModelExpandDepth: 3,
      docExpansion: 'list',
      defaultModelRendering: 'model',
    },
  },
});

apiRouter.map(JsonRouter, {});
apiRouter.map(LibraryRouter, {});
