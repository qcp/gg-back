const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const mongo = require("./utils/mongo");
const auth = require("./controllers/auth.controller");
const utils = require("./controllers/utils.controller");
const middleware = require("./middleware");

const a = require("./controllers/admin.controller");
const e = require("./controllers/examinee.controller");
const r = require("./controllers/reviewer.controller");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));

mongo.init(app).then(() => {
    return app.listen(process.env.PORT || 3000);
}).then(() => {
    console.info("Waiting for requests...");
}).catch(err => {
    console.error(err);
    throw err;
});

app.get("/", (request, response) => {
    response.sendStatus(200);
})

app.get('/google/url', auth.googleUrl)
app.get('/google/o2c', auth.googleCallback)

app.get('/utils/idList', [middleware.auth.verifySignIn], utils.idList)
app.post('/utils/upload-files', [middleware.auth.verifySignIn], utils.uploadFiles)
app.get('/utils/download-file', [middleware.objectId.parseObjectId], utils.downloadFile)
app.delete('/utils/delete-file', [middleware.auth.verifySignIn, middleware.objectId.parseObjectId], utils.deleteFile)
app.post('/utils/send-email-secret', [middleware.auth.verifySignIn, middleware.objectId.parseObjectId], utils.sendEmailSecret)

app.post('/signin', [middleware.auth.verifySignIn], auth.signin)

app.post('/a/builder/inquirer', [middleware.auth.verifySignIn, middleware.objectId.parseObjectId], a.updateInquirer)
app.get('/a/builder/inquirer', [middleware.auth.verifySignIn, middleware.objectId.parseObjectId], a.getInquirer)
app.post('/a/builder/examinees', [middleware.auth.verifySignIn, middleware.objectId.parseObjectId], a.updateExaminees)
app.get('/a/builder/examinees', [middleware.auth.verifySignIn, middleware.objectId.parseObjectId], a.getExaminees)
app.post('/a/builder/reviewers', [middleware.auth.verifySignIn, middleware.objectId.parseObjectId], a.updateReviewers)
app.get('/a/builder/reviewers', [middleware.auth.verifySignIn, middleware.objectId.parseObjectId], a.getReviewers)
app.get('/a/builder/results', [middleware.auth.verifySignIn, middleware.objectId.parseObjectId], a.getResults)

app.get('/a/dashboard', [middleware.auth.verifySignIn, middleware.objectId.parseObjectId], a.getDashboard)

app.post('/e/viewer', [middleware.auth.verifySignIn, middleware.objectId.parseObjectId], e.updateInquirer)
app.get('/e/viewer', [middleware.auth.verifySignIn, middleware.objectId.parseObjectId], e.getInquirer)

app.post('/r/viewer', [middleware.auth.verifySignIn, middleware.objectId.parseObjectId], r.updateAnswer)
app.get('/r/viewer', [middleware.auth.verifySignIn, middleware.objectId.parseObjectId], r.getAnswers)







