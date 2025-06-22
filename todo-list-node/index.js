const tasklist = require('./user/tasklist');
const bgSearch = require('./user/backgroundsearch');
const login = require('./login');

async function getHtml(req, user) {
    let taskListHtml = await tasklist.html(user);

    return `<h2>Welcome, `+user.username+`!</h2>` + taskListHtml + '<hr />' + bgSearch.html(req);
}

module.exports = {
    html: getHtml
}
