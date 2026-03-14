const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

const requestCounts = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.resetTime > WINDOW_MS) {
      requestCounts.delete(ip);
    }
  }
}, WINDOW_MS);

module.exports = () => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, {
        count: 1,
        resetTime: now
      });
      return next();
    }

    const data = requestCounts.get(ip);

  
    if (now - data.resetTime > WINDOW_MS) {
      data.count = 1;
      data.resetTime = now;
      return next();
    }

    data.count++;

   
    if (data.count > MAX_REQUESTS) {
      const retryAfter = Math.ceil((data.resetTime + WINDOW_MS - now) / 1000);
      
      return res.status(429).json({
        success: false,
        statusCode: 429,
        message: 'Too many requests. Please try again later.',
        error: {
          type: 'RATE_LIMIT_EXCEEDED',
          retryAfter: retryAfter,
          limit: MAX_REQUESTS,
          window: `${WINDOW_MS / 1000}s`
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    res.set({
      'X-RateLimit-Limit': MAX_REQUESTS.toString(),
      'X-RateLimit-Remaining': (MAX_REQUESTS - data.count).toString(),
      'X-RateLimit-Reset': new Date(data.resetTime + WINDOW_MS).toISOString()
    });

    next();
  };
};



