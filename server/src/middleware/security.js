export function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
}

export function createRateLimiter({
  windowMs,
  max,
  now = Date.now,
  key = (req) => req.ip ?? req.socket?.remoteAddress ?? 'unknown',
} = {}) {
  const buckets = new Map();

  return function rateLimit(req, res, next) {
    const currentTime = now();
    const bucketKey = key(req);
    const existing = buckets.get(bucketKey);
    const bucket = !existing || currentTime >= existing.resetAt
      ? { count: 0, resetAt: currentTime + windowMs }
      : existing;
    bucket.count += 1;
    buckets.set(bucketKey, bucket);

    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1000))));
      return res.status(429).json({
        error: 'Bạn thao tác quá nhanh. Vui lòng chờ rồi thử lại.',
        code: 'RATE_LIMITED',
      });
    }
    return next();
  };
}
