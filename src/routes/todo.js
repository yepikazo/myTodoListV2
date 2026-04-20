import { Hono } from 'hono';
import { db } from '../db.js';
import { jwtAuth, isPremium } from '../middlewares/auth.js';

export const todoRoutes = new Hono();

todoRoutes.use('*', jwtAuth);

todoRoutes.get('/', async (c) => {
  const user = c.get('user');
  const [rows] = await db.execute('SELECT * FROM todos WHERE user_id = ? ORDER BY id DESC', [user.id]);
  return c.json(rows);
});

todoRoutes.post('/', async (c) => {
  const user = c.get('user');
  const { task } = await c.req.json();
  
  const [result] = await db.execute(
    'INSERT INTO todos (user_id, task, is_premium) VALUES (?, ?, ?)',
    [user.id, task, false]
  );
  return c.json({ message: 'Todo ditambahkan', id: result.insertId }, 201);
});

todoRoutes.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const { is_completed } = await c.req.json();
  
  await db.execute(
    'UPDATE todos SET is_completed = ? WHERE id = ? AND user_id = ?',
    [is_completed, id, user.id]
  );
  return c.json({ message: 'Todo diperbarui' });
});

todoRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  await db.execute('DELETE FROM todos WHERE id = ? AND user_id = ?', [id, user.id]);
  return c.json({ message: 'Todo dihapus' });
});

todoRoutes.post('/premium', isPremium, async (c) => {
  const user = c.get('user');
  const { task } = await c.req.json();
  
  const [result] = await db.execute(
    'INSERT INTO todos (user_id, task, is_premium) VALUES (?, ?, ?)',
    [user.id, task, true]
  );
  return c.json({ message: 'Priority Todo ditambahkan!', id: result.insertId }, 201);
});