const mongodb = require("mongodb");

const mongoClient = new mongodb.MongoClient(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

module.exports.init = function (app) {
    return new Promise((resolve, reject) => {
        mongoClient.connect().then(client => {
            app.locals.users = client.db("gg").collection("users");
            app.locals.groups = client.db("gg").collection("groups");
            app.locals.apis = client.db("gg").collection("apis");
            app.locals.inquirers = client.db("gg").collection("inquirers");
            app.locals.answers = client.db("gg").collection("answers");
            app.locals.bucket = new mongodb.GridFSBucket(client.db("gg"), { bucketName: 'files' });
            resolve(client);
        }).catch(err => {
            reject(err)
        });
    });
}