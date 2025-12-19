import express from 'express';

export function apiKeyAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return res.status(401).json({ error: 'invalid_api_key' });
  const provided = (req.headers['x-api-key'] as string) || req.body?.apiKey || (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (provided !== apiKey) return res.status(401).json({ error: 'invalid_api_key' });
  return next();
}

export default apiKeyAuth;