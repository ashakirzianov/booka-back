import { SwaggerRouter } from 'koa-swagger-decorator';
import EpubRouter from './routes/epub';
import JsonRouter from './routes/json';
import LibraryRouter from './routes/library';

const router = new SwaggerRouter();

// swagger docs avaliable at http://localhost:3000/swagger-html
router.swagger({
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
      defaultModelRendering: 'model'
    }
  }
});

router.map(EpubRouter, { });
router.map(JsonRouter, { });
router.map(LibraryRouter, { });

export default router;
