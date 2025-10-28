import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes';
import userAuthRoutes from './routes/userAuthRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import favoritesRoutes from './routes/favoritesRoutes';
import promoCodeRoutes from './routes/promoCodeRoutes';
import adminUserRoutes from './routes/adminUserRoutes';
import addressRoutes from './routes/addressRoutes';
import cmsRoutes from './routes/cmsRoutes';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../uploads');

app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/user/auth', userAuthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/admin', adminUserRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/cms', cmsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
