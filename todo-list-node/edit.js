const db = require('./fw/db');

async function getHtml(req, userId) {
    let title = '';
    let state = '';
    let taskId = '';
    let html = '';
    let options = ["Open", "In Progress", "Done"];

    if(req.query.id !== undefined) {
        taskId = req.query.id;

        const getTaskCreatorSql = "SELECT userID FROM tasks WHERE ID=?";
        const getTaskCreatorParams = [taskId];
        const taskCreatorResult = await db.executeStatement(getTaskCreatorSql, getTaskCreatorParams);

        if (taskCreatorResult.length === 0) {
            return `<p class="error">Task nicht gefunden.</p>`;
        }

        const taskCreatorId = taskCreatorResult[0].userID;

        if (userId !== taskCreatorId) {
            return `<p class="error">Diese Task wurde nicht von dir erstellt, daher kannst du diese nicht bearbeiten.</p>`;
        }

        const sql = "SELECT ID, title, state FROM tasks WHERE ID=?";
        const params = [taskId];
        const results = await db.executeStatement(sql, params);

        if(results.length > 0) {
            title = results[0].title;
            state = results[0].state;
        }

        html += `<h1>Edit Task</h1>`;
    } else {
        html += `<h1>Create Task</h1>`;
    }

    html += `
    <form id="form" method="post" action="savetask">
        <input type="hidden" name="id" value="`+taskId+`" />
        <div class="form-group">
            <label for="title">Description</label>
            <input type="text" class="form-control size-medium" name="title" id="title" value="`+title+`">
        </div>
        <div class="form-group">
            <label for="state">State</label>
            <select name="state" id="state" class="size-auto">`;

    for(let i = 0; i < options.length; i++) {
        let selected = state === options[i].toLowerCase() ? 'selected' : '';
        html += `<span>`+options[1]+`</span>`;
        html += `<option value='`+options[i].toLowerCase()+`' `+selected+`>`+options[i]+`</option>`;
    }

    html += `
            </select>
        </div>
        <div class="form-group">
            <label for="submit" ></label>
            <input id="submit" type="submit" class="btn size-auto" value="Submit" />
        </div>
    </form>
    <script>
        $(document).ready(function () {
        $('#form').validate({
            rules: {
                title: {
                    required: true
                }
            },
            messages: {
                title: 'Please enter a description.',
            },
            submitHandler: function (form) {
                form.submit();
            }
        });
    });
    </script>`;

    return html;
}

module.exports = { html: getHtml }
