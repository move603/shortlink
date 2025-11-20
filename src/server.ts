import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';
import https from 'https';
import path from 'path';
import { config, readSslCredentials } from './config';
import { createLimiter } from './middleware/rateLimit';
import { authRouter } from './routes/auth';
import { linksRouter } from './routes/links';
import { analyticsRouter } from './routes/analytics';
import { redirectRouter } from './routes/redirect';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));
app.use(createLimiter);

app.use(express.static(path.join(process.cwd(), 'public')));

app.use('/auth', authRouter);
app.use('/api/links', linksRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/', redirectRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

const creds = readSslCredentials();
const server = creds ? https.createServer({ key: creds.key, cert: creds.cert }, app) : http.createServer(app);
server.listen(config.port, () => {
  console.log(`Server running on ${creds ? 'https' : 'http'}://localhost:${config.port}`);
});