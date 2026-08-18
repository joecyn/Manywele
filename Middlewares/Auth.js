
const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
    try {
        const token = req.cookies && req.cookies.jwt;

        if (!token) {
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            return res.redirect('/Login');
        }

        const secret = process.env.SECRET;
        if (!secret) {
            console.warn('JWT secret not configured');
            return res.status(500).send('Server configuration error');
        }

        let decoded;
        try {
            decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
        } catch (err) {
            // clear invalid/expired cookie to avoid reuse
            res.clearCookie('jwt', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax',
            });

            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }
            return res.redirect('/Login');
        }

        // Basic payload validation
        const userId = decoded && (decoded.id || decoded._id);
        if (!userId) {
            res.clearCookie('jwt', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax',
            });
            return res.redirect('/Login');
        }

        // Do not attach raw token payload; expose only needed fields
        req.user = { id: userId, name: decoded.name };
        return next();
    } catch (err) {
        console.error('Auth middleware error:', err && err.message ? err.message : err);
        return res.status(500).send('Internal Server Error');
    }
};

module.exports = isAuthenticated;