const db = require('./fw/db');

async function getHtml(req, user) {
    let html = '';
    let taskId = '';

    // see if the id exists in the database
    if (req.body.id !== undefined && req.body.id.length !== 0) {
        taskId = req.body.id;

        const sql = "SELECT ID, title, state FROM tasks WHERE ID=?";
        const params = [taskId];
        const results = await db.executeStatement(sql, params);

        if (results.length === 0) {
            taskId = '';
        }
    }

    if (req.body.title !== undefined && req.body.state !== undefined){
        let state = req.body.state;
        let title = req.body.title;

        let userid = user.userid;

        if (taskId === ''){
            const sql = "INSERT INTO tasks (title, state, userID) VALUES (?, ?, ?)";
            const params = [title, state, userid];
            const results = await db.executeStatement(sql, params);
        } else {
            const sql = "UPDATE tasks SET title=?, state=? WHERE ID=?";
            const params = [title, state, taskId];
            const results = await db.executeStatement(sql, params);
        }

        html += "<span class='info info-success'>Update successfull</span>";
    } else {
        html += "<span class='info info-error'>No update was made</span>";
    }

    return html;
}

module.exports = { html: getHtml }
