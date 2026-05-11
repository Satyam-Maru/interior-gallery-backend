import fastify from 'fastify';
import dotenv from 'dotenv';
import supabasePlugin from './plugins/supabase';
import zodPlugin from './plugins/zod';
import stockRoutes from './modules/stock/stock.routes';
import productRoutes from './modules/products/products.routes';
import categoryRoutes from './modules/category/category.routes';
import entityRoutes from './modules/entities/entities.routes';
import locationRoutes from './modules/locations/locations.routes';

dotenv.config();

const app = fastify({
  logger: true,
});

// Register Plugins
app.register(zodPlugin);
app.register(supabasePlugin);

// Register Routes
app.register(stockRoutes, { prefix: '/api/v1/stock' });
app.register(productRoutes, { prefix: '/api/v1/products' });
app.register(categoryRoutes, { prefix: '/api/v1/categories' });
app.register(entityRoutes, { prefix: '/api/v1/entities' });
app.register(locationRoutes, { prefix: '/api/v1/locations' });

export default app;
