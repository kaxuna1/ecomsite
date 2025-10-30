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
import navigationRoutes from './routes/navigationRoutes';
import settingsRoutes from './routes/settingsRoutes';
import attributeRoutes from './routes/attributeRoutes';
import variantRoutes from './routes/variantRoutes';
import languageRoutes from './routes/languageRoutes';
import adminMediaRoutes from './routes/admin/mediaRoutes';
import adminProductMediaRoutes from './routes/admin/productMediaRoutes';
import apiKeysRoutes from './routes/apiKeysRoutes';
import aiRoutes from './routes/aiRoutes';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../uploads');

// Serve static files at both paths for backwards compatibility
app.use('/uploads', express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/user/auth', userAuthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/admin', adminUserRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api', variantRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/admin/media', adminMediaRoutes);
app.use('/api/admin', adminProductMediaRoutes);
app.use('/api/admin/api-keys', apiKeysRoutes);
app.use('/api/admin/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
