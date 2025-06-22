const db = require('../fw/db');
const escape = require('escape-html');
const login = require('../login');

async function getHtml(user) {
    let html = `
    <section id="list">
        <a href="edit">Create Task</a>
        <table>
            <tr>
                <th>ID</th>
                <th>Description</th>
                <th>State</th>
                <th></th>
            </tr>
    `;

    const sql = "SELECT ID, title, state FROM tasks WHERE UserID=?";
    const params = [user.userid];
    const results = await db.executeStatement(sql, params);

    results.forEach(function(row) {
        html += `
            <tr>
                <td>`+escape(row.ID)+`</td>
                <td class="wide">`+escape(row.title)+`</td>
                <td>`+ucfirst(row.state)+`</td>
                <td>
                    <a href="edit?id=`+escape(row.ID)+`">edit</a>
                </td>
            </tr>`;
    });

    html += `
        </table>
    </section>`;

    return html;
}

function ucfirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {
    html: getHtml
}
