const login = require('../login');
const db = require('../fw/db');

async function getHtml(req) {
    let content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TBZ 'Secure' App</title>
    <link rel="stylesheet" href="/style.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.0/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-validate/1.19.1/jquery.validate.min.js"></script>
</head>
<body>
    <header>
        <div>This is the insecure m183 test app</div>`;

    let id = 0;
    let roleid = 0;

    let token = req.cookies.authToken;
    let tokenInfo = login.getUserFromToken(token);

    if (tokenInfo.valid) {
        let user = tokenInfo.user;

        const sql = "SELECT users.id userid, roles.id roleid, roles.title rolename FROM users INNER JOIN permissions ON users.id=permissions.userid INNER JOIN roles ON permissions.roleID=roles.id WHERE userid=?";
        const params = [user.userid];
        const results = await db.executeStatement(sql, params);

        console.log(results);

        // load role from db
        if(results.length > 0) {
            roleid = results[0].roleid;
        }

        content += `
        <nav>
            <ul>
                <li><a href="/">Tasks</a></li>
                <li><a href="/totp/secret">MFA</a></li>`;
        if(roleid === 1) {
            content += `
                <li><a href="/admin/users">User List</a></li>`;
        }
        content += `
                <li><a href="/logout">Logout</a></li>
            </ul>
        </nav>`;
    }

    content += `
    </header>
    <main>`;

    return content;
}

module.exports = getHtml;
