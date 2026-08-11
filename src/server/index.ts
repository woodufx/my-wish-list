import { Hono } from 'hono';
// Side-effect import: validates the server environment at boot, so a missing or
// malformed DATABASE_URL/OWNER_SECRET/COOKIE_SECRET fails fast with a clear
// message rather than surfacing deep inside a request.
import './env';
import { notFound, onError } from './middleware/error';
import { guestRoutes } from './routes/guest';
import { ownerRoutes } from './routes/owner';
import { adminRoutes } from './routes/admin';

/**
 * The Hono application. Everything is mounted under `/api`, matching the paths
 * the frontend calls (and the MSW handlers) so the same client code works
 * against the real backend unchanged.
 */
export const app = new Hono().basePath('/api');

app.onError(onError);
app.notFound(notFound);

// Liveness probe — also the first thing to hit once deployed.
app.get('/health', (c) => c.json({ status: 'ok' } as const));

// Resource routers.
app.route('/', guestRoutes);
app.route('/owner', ownerRoutes);
app.route('/admin', adminRoutes);

export default app;
