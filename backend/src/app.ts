import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
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
import aiPageBuilderRoutes from './routes/aiPageBuilderRoutes';
import newsletterRoutes from './routes/newsletterRoutes';
import reviewsRoutes from './routes/reviewsRoutes';
import reviewImageRoutes from './routes/reviewImageRoutes';
import reviewReminderRoutes from './routes/reviewReminderRoutes';
import staticTranslationsRoutes from './routes/staticTranslationsRoutes';
import themeRoutes from './routes/themeRoutes';

const app = express();

app.set('trust proxy', env.trustProxy);
app.disable('x-powered-by');

const allowedOrigins = env.corsOrigins;
const normalizeOrigin = (origin: string) => origin.replace(/\/$/, '');
const isOriginAllowed = (origin?: string) => {
  if (!origin) return true;
  if (allowedOrigins.length === 0) {
    return env.nodeEnv !== 'production';
  }
  return allowedOrigins.includes(normalizeOrigin(origin));
};

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept-Language', 'X-Requested-With', 'X-Request-Id'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400
};

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
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
app.use('/api/ai/pages', aiPageBuilderRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api', reviewsRoutes);
app.use('/api/review-images', reviewImageRoutes);
app.use('/api/admin/review-reminders', reviewReminderRoutes);
app.use('/api/static-translations', staticTranslationsRoutes);
app.use('/api/themes', themeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
