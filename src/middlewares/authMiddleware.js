const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

exports.transferRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,              // limit each user to 5 transfers per minute
  message: 'Too many transfer attempts. Please wait and try again.'
});

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

module.exports = authenticate;