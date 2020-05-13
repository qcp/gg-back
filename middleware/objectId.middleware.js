const ObjectId = require("mongodb").ObjectId;

function parseProp(obj) {
    for (var prop in obj) {
        if (typeof (obj[prop]) === 'object') {
            if (prop === 'reviewers' && Array.isArray(obj[prop]))
            obj[prop] = obj[prop].map(val => ObjectId(val));
            else
                parseProp(obj[prop]);
        } else if (prop === '_id' || prop.endsWith('Id')) {
            obj[prop] = ObjectId(obj[prop]);
        }
    }
}

module.exports.parseObjectId = (request, response, next) => {
    parseProp(request.query);
    parseProp(request.body);
    next();
};