import { SwaggerRouter } from 'koa-swagger-decorator';
import { EpubRouter } from './epub';
import { JsonRouter } from './json';
import { LibraryRouter } from './library';

export const ApiRouter = new SwaggerRouter();

// swagger docs available at http://localhost:3042/swagger-html
ApiRouter.swagger({
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

ApiRouter.map(EpubRouter, {});
ApiRouter.map(JsonRouter, {});
ApiRouter.map(LibraryRouter, {});
