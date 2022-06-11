const jwt = require('express-jwt');
const secret = process.env.secret;
const api = process.env.API_URL;

/**
 * checks payload for isAdmin attribute
 * allows: users with admin rights
 */
async function isRevoked(_req, payload, done) {
    if (!payload.isAdmin) {
        done(null, true); // revoke
    }

    done(); // allow
}

module.exports = jwt({
    secret: secret,
    algorithms: ["HS256"],
    isRevoked: isRevoked
}).unless({
    path: [
        // public access
        { url: /\/api\/v1\/products(.*)/, methods: ['GET', 'POST', 'OPTIONS', 'PUT'] },
        { url: /\/api\/v1\/categories(.*)/, methods: ['GET', 'OPTIONS'] },
        { url: /\/api\/v1\/reviews(.*)/, methods: ['GET', 'PUT', 'OPTIONS'] },
        { url: /\/api\/v1\/users(.*)/, methods: ['GET', 'OPTIONS'] },
        { url: /\/public\/uploads(.*)/, methods: ['GET', 'OPTIONS'] },
        `${api}/users/login`,
        `${api}/users/register`
    ]
})