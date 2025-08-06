///////////////////////////////////////////////////////////////////////
// DO NOT CHANGE THE ORDER OF THE IMPORTS;
// DOT ENV AND MODULE ALIAS WILL NOT WORK PROPERLY UNLESS THEY ARE IMPORTED FIRST
import * as dotenv from 'dotenv';
dotenv.config();
if (process.env.NODE_ENV === 'production') require('module-alias/register');
///////////////////////////////////////////////////////////////////////

import hpp from 'hpp';
import cors from 'cors';
import morgan from 'morgan';
import xss from 'xss-clean';
import helmetCsp from 'helmet-csp';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet, { HelmetOptions } from 'helmet';
import express, { Application, NextFunction, Request, Response } from 'express';
import mongoSanitize from 'express-mongo-sanitize';

import { timeoutMiddleware, validateDataWithZod } from '@/middlewares';
import { logger, stream, stopQueueWorkers } from '@/common';
import { ENVIRONMENT, stopRedisConnections } from '@/config';
import { errorHandler } from '@/controllers';
import { authRouter } from '@/routes';

dotenv.config();

/**
 * Handle uncaught exceptions.
 */
process.on('uncaughtException', async (error: Error) => {
  console.log('UNCAUGHT EXCEPTION!! 💥 Server Shutting down...');
  console.log(error.name, error.message);
  logger.error('UNCAUGHT EXCEPTION!! 💥 Server Shutting down...', error);
  // Close Redis connections
  await stopRedisConnections();

  // Stop queue workers
  await stopQueueWorkers();
  process.exit(1);
});

/**
 *  Default app configuration
 */
const app: Application = express();

/**
 *  Express Configuration
 */
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']); // trust proxy for rate limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

/**
 * Compression Middleware
 */
app.use(compression());

/**
 * Rate limiter
 */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, //Limit each IP to 100 request
    message: 'Too many requests, please try again later.',
  }),
);

/**
 * Middleware to allow CORS
 */
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  }),
);

/**
 * Use Helmet middleware for security headers
 */
app.use(
  helmet({
    contentSecurityPolicy: false, //Disable the default CSP middleware
  }),
);
// Use helmet-csp middleware for Content Security Policy
app.use(
  helmetCsp({
    directives: {
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      defaultSrc: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
      imgSrc: ["'self'", 'data:', 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'https://api.mapbox.com'],
    },
  }),
);

const helmetConfig: HelmetOptions = {
  // X-Frame-Options header to prevent clickjacking
  frameguard: { action: 'deny' },
  // X-XSS-Protection header to enable browser's built-in XSS protection
  xssFilter: true,
  // Referrer-Policy header
  referrerPolicy: { policy: 'strict-origin' },
  // Strict-Transport-Security (HSTS) header for HTTPS enforcement
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
};

app.use(helmet(helmetConfig));

/**
 * Secure cookies and other helmet-related configurations
 */
app.use(helmet.noSniff());
app.use(helmet.ieNoOpen());
app.use(helmet.hidePoweredBy());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.frameguard({ action: 'deny' }));
// Prevent browser from caching sensitive information
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});
// Data sanitization against NoSQL query injection
app.use(mongoSanitize());
// Data sanitization against XSS
app.use(xss());
// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ['date', 'createdAt'], // whitelist some parameters
  }),
);

/**
 * Logger Middleware
 */
app.use(morgan(ENVIRONMENT.APP.ENV !== 'development' ? 'combined' : 'dev', { stream }));
// add request time to req object
app.use((req: Request, res: Response, next: NextFunction) => {
  req.requestTime = new Date().toISOString();
  next();
});

/**
 * Error handler middlewares
 */
app.use(timeoutMiddleware);

/**
 * Initialize routes
 */
app.use(validateDataWithZod);
app.use('/api/v1/alive', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running!',
  });
});
app.use('/api/v1/auth', authRouter);

app.use(errorHandler);

app.all('/*', async (req: Request, res: Response) => {
  logger.error('route not found' + new Date(Date.now()) + ' ' + req.originalUrl);
  res.status(404).json({
    status: 'error',
    message: `OOPs!! No handler defined for ${req.method.toUpperCase()}: ${
      req.url
    } route. Check the API documentation for more details.`,
  });
});

export default app;
