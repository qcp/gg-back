const auth = require("./auth.middleware");
const objectId = require("./objectId.middleware");

module.exports = {
    auth,
    objectId
};