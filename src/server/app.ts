///////////////////////////////////////////////////////////////////////
// DO NOT CHANGE THE ORDER OF THE IMPORTS;
// DOT ENV AND MODULE ALIAS WILL NOT WORK PROPERLY UNLESS THEY ARE IMPORTED FIRST
import * as dotenv from 'dotenv'
dotenv.config()
if (process.env.NODE_ENV === 'production') require('module-alias/register')
///////////////////////////////////////////////////////////////////////

import hpp from 'hpp'
import cors from 'cors'
import morgan from 'morgan'
import xss from 'xss-clean'
import helmetCsp from 'helmet-csp'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import helmet, { HelmetOptions } from 'helmet'
import express, {
  Express,
  Application,
  NextFunction,
  Request,
  Response,
} from 'express'
import mongoSanitize from 'express-mongo-sanitize'

import { logger, stream } from '@/common'
import { ENVIRONMENT } from '@/config'
import { validateDataWithZod } from '@/middlewares'
// import { errorHandler } from './middlewares/errorHandler'
// import routes from './routes'

dotenv.config()

/**
 * Handle uncaught exceptions.
 */
process.on('uncaughtException', async (error: Error) => {
  console.log('UNCAUGHT EXCEPTION!! 💥 Server Shutting down...')
  console.log(error.name, error.message)
  logger.error('UNCAUGHT EXCEPTION!! 💥 Server Shutting down...', error)
  // add function to stop queue workers here
  // await stopQueueWorkers()
  process.exit(1)
})

/**
 *  Default app configuration
 */
const app: Application = express()
const port = ENVIRONMENT.APP.PORT
const appName = ENVIRONMENT.APP.NAME

/**
 *  Express Configuration
 */
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']) // trust proxy for rate limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())

/**
 * Compression Middleware
 */
app.use(compression())

/**
 * Rate limiter
 */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, //Limit each IP to 100 request
    message: 'Too many requests, please try again later.',
  })
)

/**
 * Middleware to allow CORS
 */
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })
)

/**
 * Configure content security policy (CSP) ==> Prevent cross-site scripting (XSS)
 */
const contentSecurityPolicy = {
  directive: {
    baseUri: ["'self'"],
    objectSrc: ["'none'"],
    defaultSrc: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: [],
    imgSrc: ["'self'", 'data:', 'https:'],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    connectSrc: ["'self'", 'https://api.mapbox.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  },
}

/**
 * Use Helmet middleware for security headers
 */
app.use(
  helmet({
    contentSecurityPolicy: false, //Disable the default CSP middleware
  })
)
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
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'https://api.mapbox.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    },
  })
)

const helmetConfig: HelmetOptions = {
  // X-Frame-Options header to prevent clickjacking
  frameguard: { action: 'deny' },
  // X-XSS-Protection header to enable browser's built-in XSS protection
  xssFilter: true,
  // Referrer-Policy header
  referrerPolicy: { policy: 'strict-origin' },
  // Strict-Transport-Security (HSTS) header for HTTPS enforcement
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}

app.use(helmet(helmetConfig))

/**
 * Secure cookies and other helmet-related configurations
 */
app.use(helmet.noSniff())
app.use(helmet.ieNoOpen())
app.use(helmet.hidePoweredBy())
app.use(helmet.dnsPrefetchControl())
app.use(helmet.permittedCrossDomainPolicies())
app.use(helmet.frameguard({ action: 'deny' }))
// Prevent browser from caching sensitive information
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')
  next()
})
// Data sanitization against NoSQL query injection
app.use(mongoSanitize())
// Data sanitization against XSS
app.use(xss())
// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ['date', 'createdAt'], // whitelist some parameters
  })
)

/**
 * Logger Middleware
 */
app.use(
  morgan(ENVIRONMENT.APP.ENV !== 'development' ? 'combined' : 'dev', { stream })
)
// add request time to req object
app.use((req: Request, res: Response, next: NextFunction) => {
  req.requestTime = new Date().toISOString()
  next()
})

/**
 * Initialize routes
 */
app.use(validateDataWithZod)
app.use('/api/v1/alive', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
  })
})
// other routes here

app.all('/*', async (req: Request, res: Response) => {
  logger.error('route not found' + new Date(Date.now()) + ' ' + req.originalUrl)
  res.status(404).json({
    status: 'error',
    message: `OOPs!! No handler defined for ${req.method.toUpperCase()}: ${
      req.url
    } route. Check the API documentation for more details.`,
  })
})
