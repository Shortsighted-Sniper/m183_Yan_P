const axios = require('axios');
const querystring = require('querystring');
const searchProvider = require('./search/v2/index');

async function getHtml(req, user) {
    if (req.body.terms === undefined){
        return "Not enough information provided";
    }

    let terms = req.body.terms;

    let result = await searchProvider.search(req, user);
    return result;
}

module.exports = { html: getHtml };
