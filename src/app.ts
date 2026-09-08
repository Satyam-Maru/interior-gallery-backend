import fastify from 'fastify';
import dotenv from 'dotenv';
import supabasePlugin from './plugins/supabase';
import zodPlugin from './plugins/zod';
import billRoutes from './modules/stock/stock.routes';
import productRoutes from './modules/products/products.routes';
import categoryRoutes from './modules/category/category.routes';
import partyRoutes from './modules/parties/parties.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

dotenv.config();

const app = fastify({
  logger: true,
});

// Register Plugins
app.register(zodPlugin);
app.register(supabasePlugin);

// Register Routes
app.register(billRoutes, { prefix: '/api/v1/bills' });
app.register(productRoutes, { prefix: '/api/v1/products' });
app.register(categoryRoutes, { prefix: '/api/v1/categories' });
app.register(partyRoutes, { prefix: '/api/v1/parties' });
app.register(partyRoutes, { prefix: '/api/v1/entities' }); // Fallback alias
app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });

export default app;
