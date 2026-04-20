import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { authRoutes } from './routes/auth.js';
import { todoRoutes } from './routes/todo.js';

const app = new Hono();

app.route('/api/auth', authRoutes);
app.route('/api/todos', todoRoutes);


app.use('/*', serveStatic({ root: './public' }));

export default {
  port: 3000,
  fetch: app.fetch,
};

console.log('🔥 Server berjalann di http://localhost:3000');