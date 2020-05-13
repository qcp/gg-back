const ObjectId = require("mongodb").ObjectId;

const { Readable } = require('stream');
const multer = require('multer');

const jwt = require("jsonwebtoken");
const mailTemplates = require("../utils/mailTemplates");
const google = require("../utils/google");

module.exports.idList = (request, response) => {
    response.json({ status: "OK", idList: [...Array(10).keys()].map(() => ObjectId()) });
}


module.exports.uploadFiles = (request, response) => {
    const upload = multer({ storage: multer.memoryStorage(), limits: { fields: 1, fileSize: 167772160, files: 5, parts: 2 } });

    upload.array('files[]')(request, response, (err) => {
        if (err) return response.json({ status: "ERROR", error: err });

        Promise.all(request.files.map(file => new Promise(function (resolve, reject) {
            const readableFileStream = new Readable();
            readableFileStream.push(file.buffer);
            readableFileStream.push(null);

            let uploadStream = request.app.locals.bucket.openUploadStream(file.originalname, { metadata: { mimetype: file.mimetype } });
            readableFileStream.pipe(uploadStream);

            uploadStream.on('error', err => reject(err));
            uploadStream.on('finish', () => resolve({ _id: uploadStream.id, filename: file.originalname }));
        }))).then(res => {
            response.json({ status: "OK", files: res });
            console.debug('/uploadFiles', res);
        }).catch(err => {
            response.json({ status: "ERROR", error: err });
            console.error('/uploadFiles', err);
        });
    });
}
module.exports.downloadFile = (request, response) => {
    request.app.locals.bucket.find({ _id: request.query._id }).next()
        .then(file => new Promise(function (resolve, reject) {
            if (!file) throw 'Not found';

            response.set('content-type', file.metadata.mimetype);
            response.set('content-disposition', 'attachment; filename*=utf-8\'\'' + encodeURI(file.filename));
            response.set('accept-ranges', 'bytes');

            let downloadStream = request.app.locals.bucket.openDownloadStream(file._id);

            downloadStream.on('data', chunk => response.write(chunk));
            downloadStream.on('error', err => reject(err));
            downloadStream.on('end', () => resolve());
        })).then(() => {
            response.end();
            console.debug('/downloadFile', request.query._id);
        }).catch(err => {
            response.json({ status: "ERROR", error: err });
            console.error('/downloadFile', err);
        });
}
module.exports.deleteFile = (request, response) => {
    request.app.locals.bucket.delete(request.query._id)
        .then(() => {
            response.json({ status: "OK" });
            console.debug('/deleteFile', request.query._id);
        }).catch(err => {
            response.json({ status: "ERROR", error: err });
            console.error('/deleteFile', err);
        });
}


module.exports.sendEmailSecret = (request, response) => {
    request.app.locals.inquirers.findOne(
        { _id: request.body.inquirerId },
        { projection: { 'general': 1, 'metadata': 1 } }
    ).then(inquirer => {
        return Promise.all([
            request.app.locals.users.findOne({
                _id: inquirer.metadata.createUserId
            }),
            request.app.locals.users.findOne({
                _id: request.body.recepientId
            }),
            inquirer
        ])
    }).then(res => {
        let developer = res[0];
        let recepient = res[1];
        let inquirer = res[2];

        let expiresIn = 0;
        if (recepient.role == 'reviewer')
            expiresIn = (new Date(inquirer.general.finishDateReviewers) - new Date()) / 1000 + 86400;
        else if (recepient.role == 'examinee')
            expiresIn = (new Date(inquirer.general.finishDateExaminees) - new Date()) / 1000 + 86400;

        const newToken = jwt.sign({ id: recepient._id, role: recepient.role, inquirerId: inquirer._id }, process.env.JWT_SECRET, { expiresIn: Math.round(expiresIn) });

        return google.sendEmail(developer, mailTemplates.resendEmail({
            fromEmail: developer.email,
            toName: recepient.name,
            toEmail: recepient.email,
            toRole: recepient.role,
            token: newToken
        }));
    }).then(res => {
        response.json({ status: "OK", user: res });
        console.debug('/sendEmailSecret', res);
    }).catch(err => {
        response.json({ status: "ERROR", error: err });
        console.error('/sendEmailSecret', err);
    });
}