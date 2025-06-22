const db = require('../fw/db');

async function getHtml() {
    const sql = "SELECT users.ID, users.username, users.password, roles.title FROM users inner join permissions on users.ID = permissions.userID inner join roles on permissions.roleID = roles.ID order by username";
    const results = await db.executeStatement(sql, []);

    let html = '';

    html += `
    <h2>User List</h2>

    <table>
        <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
        </tr>`;

    results.map(function (record) {
        html += `<tr><td>`+record.ID+`</td><td>`+record.username+`</td><td>`+record.title+`</td></tr>`;
    });

    html += `
    </table>`;

    return html;
}

function getNotAuthorizedHtml() {
    return `
    <h2>Not Authorized!</h2>
    `;
}

module.exports = { 
    html: getHtml(),
    notAuthorizedHtml: getNotAuthorizedHtml()
};
