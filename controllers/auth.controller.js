const ObjectId = require("mongodb").ObjectId;
const google = require("../utils/google");

const jwt = require("jsonwebtoken");

module.exports.googleUrl = (request, response) => {
    response.json({ status: "OK", url: google.authUrl });
}
module.exports.googleCallback = (request, response) => {
    if (!request.query.code) throw "Get out of here";

    google.getUser(request.query.code)
        .then(res => {
            return request.app.locals.users.findOneAndUpdate(
                { 'google.id': res.google.id },
                { $set: res },
                { upsert: true, returnOriginal: false });
        }).then(res => {
            const token = jwt.sign({ id: res.value._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: 86400 });            
            response.redirect(`${process.env.FRONT_ENDPOINT}/login?secret=${token}`);
            console.debug('googleCallback', token);
        }).catch(err => {
            response.redirect(`${process.env.FRONT_ENDPOINT}/login`);
            console.error('googleCallback', err);
        });
}

module.exports.signin = (request, response) => {
    request.app.locals.users.findOne(
        { _id: ObjectId(request.userId)  }
    ).then(res => {
        if (!res) throw "Non valid secret";
        if(res.role != request.userRole) throw "Broken secret";
        response.json({ status: "OK", user: res });
        console.debug('signin', res);
    }).catch(err => {
        response.json({ status: "ERROR", error: err });
        console.error('signin', err);
    });
}