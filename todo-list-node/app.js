const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const jwt = require('jsonwebtoken');

const header = require('./fw/header');
const footer = require('./fw/footer');
const login = require('./login');
const totp = require('./totp');
const index = require('./index');
const adminUser = require('./admin/users');
const editTask = require('./edit');
const saveTask = require('./savetask');
const search = require('./search');
const searchProvider = require('./search/v2/index');
const config = require('./config');
const db = require('./fw/db');

const app = express();
const PORT = 3000;

// Middleware für Session-Handling
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Middleware für Body-Parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Routen
app.get('/', async (req, res) => {
    let isActiveUserSession = activeUserSession(req);

    if (isActiveUserSession.valid) {
        let user = isActiveUserSession.user;
        let html = await wrapContent(await index.html(req, user), req)
        res.send(html);
    } else {
        res.redirect('login');
    }
});

app.post('/', async (req, res) => {
    let isActiveUserSession = activeUserSession(req);

    if (isActiveUserSession.valid) {
        let user = isActiveUserSession.user;
        let html = await wrapContent(await index.html(req, user), req)
        res.send(html);
    } else {
        res.redirect('login');
    }
})

// edit task
app.get('/admin/users', async (req, res) => {
    let isActiveUserSession = activeUserSession(req);

    if (isActiveUserSession.valid) {
        let user = isActiveUserSession.user;
        let isAuthorized = await checkForRole(user, 1);
        if (isAuthorized) {
            let html = await wrapContent(await adminUser.html, req);
            res.send(html);
        } else {
            let html = await wrapContent(await adminUser.notAuthorizedHtml, req);
            res.send(html);
        }
    } else {
        res.redirect('/');
    }
});

// edit task
app.get('/edit', async (req, res) => {
    let isActiveUserSession = activeUserSession(req);

    if (isActiveUserSession.valid) {
        let html = await wrapContent(await editTask.html(req, isActiveUserSession.user.userid), req);
        res.send(html);
    } else {
        res.redirect('/');
    }
});

// Login-Seite anzeigen
app.get('/login', async (req, res) => {
    let content = await login.handleLogin(req, res);

    if(content.user.userid !== 0) {
        login.startUserSession(res, content.user);
    } else {
        // login unsuccessful or not made yet... display login form
        let html = await wrapContent(content.html, req);
        res.send(html);
    }
});

// POST-Route für Login (Einloggen)
app.post('/login', async (req, res) => {
    let content = await login.handleLogin(req, res);

    if(content.user.userid !== 0) {
        login.startUserSession(res, content.user);
    } else {
        // login unsuccessful or not made yet... display login form
        let html = await wrapContent(content.html, req);
        res.send(html);
    }
});

// 2FA
app.get('/totp', async (req, res) => {
    let isActiveLoginSession = activeLoginSession(req);

    if (isActiveLoginSession.valid) {
        let content = await totp.handleMfa(req, res);

        if (content.tooMany) {
            setTimeout(() => {
                res.redirect("/login");
            }, 3000);
        } else if (content.result) {
            totp.startUserSession(req, res);
        } else {
            let html = await wrapContent(content.html, req);
            res.send(html);
        }
    } else {
        res.redirect('/login');
    }
});

// POST-Route for 2FA
app.post('/totp', async (req, res) => {
    let isActiveLoginSession = activeLoginSession(req);

    if (isActiveLoginSession.valid) {
        let content = await totp.handleMfa(req, res);

        if(content.result) {
            totp.startUserSession(req, res);
        } else {
            let html = await wrapContent(content.html, req);
            res.send(html);
        }
    } else {
        res.redirect('/login');
    }
});

// QR Code for secret
app.get('/totp/secret', async (req, res) => {
    let isActiveUserSession = activeUserSession(req);

    if (isActiveUserSession.valid) {
        let user = isActiveUserSession.user;
        let html = await wrapContent(await totp.secretHtml(req), req);
        res.send(html);
    } else {
        res.redirect('/');
    }
});

// POST-Route for secret
app.post('/totp/secret', async (req, res) => {
    let isActiveUserSession = activeUserSession(req);

    if (isActiveUserSession.valid) {
        let user = isActiveUserSession.user;
        let content = await totp.saveNewOtpSecret(req, user);
        let html = await wrapContent(content, req);
        res.send(html);
    } else {
        res.redirect('/');
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.clearCookie('authToken');
    res.redirect('/login');
});

// save task
app.post('/savetask', async (req, res) => {
    let isActiveUserSession = activeUserSession(req);

    if (isActiveUserSession.valid) {
        let user = isActiveUserSession.user;
        let html = await wrapContent(await saveTask.html(req, user), req);
        res.send(html);
    } else {
        res.redirect('/');
    }
});

// search
app.post('/search', async (req, res) => {
    let isActiveUserSession = activeUserSession(req);

    if (isActiveUserSession.valid) {
        let user = isActiveUserSession.user;
        let html = await search.html(req, user);
        res.send(html);
    } else {
        res.redirect('/');
    }
});

// search provider
app.get('/search/v2/', async (req, res) => {
    let isActiveUserSession = activeUserSession(req);

    if (isActiveUserSession.valid) {
        let user = isActiveUserSession.user;
        let result = await searchProvider.search(req, user);
        res.send(result);
    } else {
        res.redirect('/');
    }
});


// Server starten
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

async function wrapContent(content, req) {
    let headerHtml = await header(req);
    return headerHtml+content+footer;
}

function activeLoginSession(req) {
    const token = req.cookies.tmpAuth;
    const tokenInfo = login.getUserFromToken(token);

    return tokenInfo;
}

function activeUserSession(req) {
    const token = req.cookies.authToken;
    const tokenInfo = login.getUserFromToken(token);

    return tokenInfo;
}

async function checkForRole(user, roleid) {
    const sql = "SELECT users.id userid, roles.id roleid, roles.title rolename FROM users INNER JOIN permissions ON users.id=permissions.userid INNER JOIN roles ON permissions.roleID=roles.id WHERE userid=?";
    const params = [user.userid];
    const results = await db.executeStatement(sql, params);

    if (results.length > 0) {
        return results[0].roleid === roleid;
    }

    return false;
}
