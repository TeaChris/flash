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
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import express, { Application } from 'express'
import mongoSanitize from 'express-mongo-sanitize'

import { logger } from '@/common'
// import { errorHandler } from './middlewares/errorHandler'
// import routes from './routes'

dotenv.config()

process.on('uncaughtException', async (error: Error) => {
  console.log('UNCAUGHT EXCEPTION!! 💥 Server Shutting down...')
  console.log(error.name, error.message)
  logger.error('UNCAUGHT EXCEPTION!! 💥 Server Shutting down...', error)
})

const app: Application = express()

app.set('trust proxy', 1)

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.',
  })
)
