const db = require('./fw/db');
const fs = require('fs');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const config = require('./config');

function getUserFromToken(token) {
    if (token) {
        const decoded = jwt.verify(token, config.jwtSecret);
        return { 'valid': true, 'user': { 'userid': decoded.userid, 'username': decoded.username } };
    }

    return { 'valid': false, 'user': undefined };
}

function logAuthEvent(username, status, reason = '') {
    try {
        const logEntry = `${new Date().toISOString()} - ${username} - ${status}` + (reason ? ` - ${reason}` : '') + `\n`;
        fs.appendFileSync('auth.log', logEntry);
    } catch (err) {
        console.error('Failed to write auth log:', err);
    }
}

async function handleLogin(req, res) {
    let msg = '';
    let user = { 'username': '', 'userid': 0 };

    if(req.body.username && req.body.password) {
        let result = await validateLogin(req.body.username, req.body.password);

        if(result.valid) {
            logAuthEvent(req.body.username, 'SUCCESS');
            user.username = req.body.username;
            user.userid = result.userId;
            msg = result.msg;
        } else {
            logAuthEvent(req.body.username, 'FAILURE', result.msg);
            msg = result.msg;
        }
    }

    return { 'html': msg + getHtml(), 'user': user };
}

function startUserSession(res, user) {
    console.log('login valid... start user session now for userid '+user.userid);

    const tmpToken = jwt.sign(
        { userid: user.userid, username: user.username, mfaValid: false },
        config.jwtSecret,
        { expiresIn: '2m' }
    );

    res.cookie('tmpAuth', tmpToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
    res.redirect('/totp');
}

async function validateLogin (username, password) {
    let result = { valid: false, msg: '', userId: 0 };
    
    try {
        const sql = `SELECT id, username, password FROM users WHERE username=?`;
        const params = [username];
        const results = await db.executeStatement(sql, params);

        if(results.length > 0) {
            let db_id = results[0].id;
            let db_password = results[0].password;

            const match = await verifyPassword(db_password, password);
            if (match) {
                result.userId = db_id;
                result.valid = true;
                result.msg = 'Login correct';
            } else {
                result.msg = 'Invalid Login';
            }
        } else {
            result.msg = 'Invalid Login';
        }

    } catch (err) {
        console.error(`Error during login attempt for ${username}:`, err);
        logAuthEvent(username, 'ERROR', err.message);
    }
    
    return result;
}

async function verifyPassword(hashedPassword, password) {
    try {
        return await argon2.verify(hashedPassword, password);
    } catch (err) {
        console.error('Error verifying password:', err);
    }
}

function getHtml() {
    return `
    <h2>Login</h2>

    <form id="form" method="post" action="/login">
        <div class="form-group">
            <label for="username">Username</label>
            <input type="text" class="form-control size-medium" name="username" id="username">
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" class="form-control size-medium" name="password" id="password">
        </div>
        <div class="form-group">
            <label for="submit" ></label>
            <input id="submit" type="submit" class="btn size-auto" value="Login" />
        </div>
    </form>`;
}

module.exports = {
    handleLogin: handleLogin,
    startUserSession: startUserSession,
    getUserFromToken: getUserFromToken
};
