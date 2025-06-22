const escape = require('escape-html');
const db = require('../../fw/db');
const login = require('../../login');

async function search(req, user) {
    if (req.body.terms === undefined){
        return "Not enough information to search";
    }

    let terms = "%"+req.body.terms+"%";
    let result = '';
    let userid = user.userid;

    const sql = "SELECT ID, title, state FROM tasks WHERE userID=? AND title LIKE ?";
    const params = [userid, terms];
    const results = await db.executeStatement(sql, params);

    if (results.length > 0) {
        results.forEach(function(row) { 
            result += escape(row.title+' ('+row.state+')');
            result += '<br />';
        });
    }

    return result;
}

module.exports = {
    search: search
};
