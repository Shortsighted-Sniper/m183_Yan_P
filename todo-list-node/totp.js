const speakeasy = require('speakeasy');
const db = require('./fw/db');
const jwt = require('jsonwebtoken');
const config = require('./config');
const login = require('./login');

// speakeasy config
const SPEAKEASY_CONFIG = {
    secretKeyLength: 20,
    encoding: 'base32'
};

// In-memory store for failed MFA attempts (replace with Redis or DB for production)
const failedMfaAttempts = {};

async function saveNewOtpSecret(req, user) {
    let html = getSecretHtml();

    let newSecret = generateOtpSecret();

    const sql = `UPDATE users SET mfaSecret=? WHERE ID=?`;
    const params = [newSecret, user.userid];
    const results = await db.executeStatement(sql, params);

    html += `</br><p>Code: ` + newSecret + `</p>`;

    return html;
}

function generateOtpSecret() {
    const secretKey = speakeasy.generateSecret({
        length: SPEAKEASY_CONFIG.secretKeyLength,
    });
    return secretKey.base32;
}

async function handleMfa(req, res) {
    let msg = '';
    let result = false;

    const token = req.cookies.tmpAuth;
    const tokenInfo = login.getUserFromToken(token);

    if (tokenInfo.valid && req.body.totp) {
        const user = tokenInfo.user;
        const userId = user.userid;

        const sql = `SELECT mfaSecret FROM users WHERE id=?`;
        const params = [userId];
        const results = await db.executeStatement(sql, params);

        if (results.length > 0) {
            let secret = results[0].mfaSecret;
            result = verifyOtp(secret, req.body.totp);

            if (result) {
                delete failedMfaAttempts[userId];
            } else {
                msg = "Code falsch!";
                
                if (!failedMfaAttempts[userId]) {
                    failedMfaAttempts[userId] = { count: 0, lastFailureTime: Date.now() };
                }

                failedMfaAttempts[userId].count++;
                failedMfaAttempts[userId].lastFailureTime = Date.now();

                if (failedMfaAttempts[userId].count >= 3) {
                    msg = "Zu viele fehlgeschlagene Versuche.";
                    res.clearCookie('tmpAuth');
                    return { 'html': msg + getHtml(), 'result': false, 'tooMany': true };
                }
            }
        } else {
            msg = "User not found";
        }
    }

    return { 'html': msg + getHtml(), 'result': result, 'tooMany': false };
}

function verifyOtp(secret, token) {
    return speakeasy.totp.verify({
        secret: secret,
        encoding: SPEAKEASY_CONFIG.encoding,
        token: token
    });
}

function startUserSession(req, res) {
    const token = req.cookies.tmpAuth;
    const tokenInfo = login.getUserFromToken(token);

    if (tokenInfo.valid) {
        const user = tokenInfo.user;

        const finalToken = jwt.sign(
            { userid: user.userid, username: user.username, mfaValid: true },
            config.jwtSecret,
            { expiresIn: '1h' }
        );

        res.cookie('authToken', finalToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
        res.clearCookie('tmpAuth');
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
}

function getHtml() {
    return `
    <h2>2FA</h2>

    <form id="form" method="post" action="/totp">
        <div class="form-group">
            <label for="totp">Code</label>
            <input type="text" class="form-control size-medium" name="totp" id="totp">
        </div>
        <div class="form-group">
            <label for="submit" ></label>
            <input id="submit" type="submit" class="btn size-auto" value="Überprüfen" />
        </div>
    </form>`;
}

function getSecretHtml() {
    return `
    <h1>2FA</h1>

    <form id="form" method="post" action="/totp/secret">
        <div class="form-group">
            <label for="submit" ></label>
            <input id="submit" type="submit" class="btn size-auto" value="Neu generieren" />
        </div>
    </form>`;
}

module.exports = {
    secretHtml: getSecretHtml,
    verifyHtml: getHtml,
    handleMfa: handleMfa,
    startUserSession: startUserSession,
    saveNewOtpSecret: saveNewOtpSecret
};