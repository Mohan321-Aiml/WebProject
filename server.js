const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const LEGACY_USERS_FILE = path.join(DATA_DIR, 'users.json');
const DATABASE_FILE = path.join(DATA_DIR, 'monitoring.db');
const PORT = Number(process.env.PORT) || 3000;
const sessions = new Map();
const publicFiles = new Set(['.html', '.css', '.js', '.ico']);
const contentTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.ico': 'image/x-icon' };
fs.mkdirSync(DATA_DIR, { recursive: true });
const database = new DatabaseSync(DATABASE_FILE);

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return { salt, hash };
}

function verifyPassword(password, user) {
    const candidate = hashPassword(password, user.salt).hash;
    return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(user.passwordHash, 'hex'));
}

function initializeDatabase() {
    database.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password_salt TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        ) STRICT;
    `);

    // Import existing JSON accounts once so no registered users are lost during the upgrade.
    const rowCount = database.prepare('SELECT COUNT(*) AS total FROM users').get().total;
    if (rowCount === 0 && fs.existsSync(LEGACY_USERS_FILE)) {
        const legacyUsers = JSON.parse(fs.readFileSync(LEGACY_USERS_FILE, 'utf8'));
        const insert = database.prepare('INSERT OR IGNORE INTO users (id, full_name, username, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)');
        database.exec('BEGIN');
        try {
            legacyUsers.forEach((user) => insert.run(user.id, user.fullName, user.username, user.salt, user.passwordHash, user.createdAt));
            database.exec('COMMIT');
        } catch (error) {
            database.exec('ROLLBACK');
            throw error;
        }
    }

    if (database.prepare('SELECT COUNT(*) AS total FROM users').get().total === 0) {
        const { salt, hash } = hashPassword('admin123');
        database.prepare('INSERT INTO users (id, full_name, username, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)')
            .run(crypto.randomUUID(), 'System Administrator', 'admin', salt, hash, new Date().toISOString());
    }
}

function findUser(username) {
    const user = database.prepare('SELECT id, full_name AS fullName, username, password_salt AS salt, password_hash AS passwordHash, created_at AS createdAt FROM users WHERE username = ?').get(username);
    return user || null;
}

function createUser({ fullName, username, password }) {
    const { salt, hash } = hashPassword(password);
    const user = { id: crypto.randomUUID(), fullName, username, salt, passwordHash: hash, createdAt: new Date().toISOString() };
    database.prepare('INSERT INTO users (id, full_name, username, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(user.id, user.fullName, user.username, user.salt, user.passwordHash, user.createdAt);
    return user;
}

function parseCookies(request) {
    return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((item) => {
        const index = item.indexOf('=');
        return [item.slice(0, index).trim(), decodeURIComponent(item.slice(index + 1))];
    }));
}

function currentUser(request) {
    const token = parseCookies(request).session;
    if (!token) return null;
    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
        sessions.delete(token);
        return null;
    }
    return session.user;
}

function sendJson(response, status, data) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(data));
}

function readBody(request) {
    return new Promise((resolve, reject) => {
        let body = '';
        request.on('data', (chunk) => {
            body += chunk;
            if (body.length > 100000) request.destroy();
        });
        request.on('end', () => {
            try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Invalid JSON request body.')); }
        });
        request.on('error', reject);
    });
}

function createSession(response, user) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { user: { id: user.id, username: user.username, fullName: user.fullName }, expiresAt: Date.now() + 86400000 });
    response.setHeader('Set-Cookie', `session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`);
}

function serveFile(request, response, pathname) {
    const requested = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.resolve(ROOT, `.${decodeURIComponent(requested)}`);
    if (!filePath.startsWith(ROOT + path.sep) || !publicFiles.has(path.extname(filePath))) return sendJson(response, 404, { error: 'Not found.' });
    const isLoginPage = path.basename(filePath) === 'index.html';
    if (path.extname(filePath) === '.html' && !isLoginPage && !currentUser(request)) {
        response.writeHead(302, { Location: '/' });
        return response.end();
    }
    if (isLoginPage && currentUser(request)) {
        response.writeHead(302, { Location: '/dashboard.html' });
        return response.end();
    }
    fs.readFile(filePath, (error, content) => {
        if (error) return sendJson(response, error.code === 'ENOENT' ? 404 : 500, { error: 'Unable to load page.' });
        response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
        response.end(content);
    });
}

initializeDatabase();
http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    try {
        if (request.method === 'POST' && url.pathname === '/api/auth/signup') {
            const { fullName = '', username = '', password = '' } = await readBody(request);
            const cleanName = fullName.trim();
            const cleanUsername = username.trim().toLowerCase();
            if (!cleanName || !/^[a-z0-9_.-]{3,30}$/.test(cleanUsername) || password.length < 8) return sendJson(response, 400, { error: 'Use a name, a 3-30 character username, and a password of at least 8 characters.' });
            if (findUser(cleanUsername)) return sendJson(response, 409, { error: 'That username is already in use.' });
            const user = createUser({ fullName: cleanName, username: cleanUsername, password });
            createSession(response, user);
            return sendJson(response, 201, { user: { id: user.id, fullName: user.fullName, username: user.username } });
        }
        if (request.method === 'POST' && url.pathname === '/api/auth/signin') {
            const { username = '', password = '' } = await readBody(request);
            const user = findUser(username.trim().toLowerCase());
            if (!user || !verifyPassword(password, user)) return sendJson(response, 401, { error: 'Invalid username or password.' });
            createSession(response, user);
            return sendJson(response, 200, { user: { id: user.id, fullName: user.fullName, username: user.username } });
        }
        if (request.method === 'POST' && url.pathname === '/api/auth/signout') {
            sessions.delete(parseCookies(request).session);
            response.setHeader('Set-Cookie', 'session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
            return sendJson(response, 200, { message: 'Signed out.' });
        }
        if (request.method === 'GET' && url.pathname === '/api/auth/me') {
            const user = currentUser(request);
            return user ? sendJson(response, 200, { user }) : sendJson(response, 401, { error: 'Not authenticated.' });
        }
        serveFile(request, response, url.pathname);
    } catch (error) {
        sendJson(response, 500, { error: error.message || 'Unexpected server error.' });
    }
}).listen(PORT, () => console.log(`Dashboard running at http://localhost:${PORT}`));
