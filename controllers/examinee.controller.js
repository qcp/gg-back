const { updateReviewerNext } = require("../utils/common");

module.exports.updateInquirer = (request, response) => {
    request.app.locals.answers.findOneAndUpdate(
        { inquirerId: request.body.inquirerId, examineeId: request.body.examineeId },
        { $set: request.body },
        { upsert: true, returnOriginal: false })
        .then(res => {
            let criteriasId = res.value.content.map(criteria => criteria._id);
            updateReviewerNext(request.app.locals, res.value.inquirerId, res.value.examineeId, criteriasId);
            return res;
        }).then(res => {
            response.json({ status: "OK" });
            console.debug('updateInquirer', res);
            return res;
        }).catch(err => {
            response.json({ status: "ERROR", error: err });
            console.error('updateInquirer', err);
        });
}
module.exports.getInquirer = (request, response) => {
    Promise.all([
        request.app.locals.inquirers.findOne(
            { _id: request.query._id }),
        request.app.locals.answers.findOne(
            { inquirerId: request.query._id, examineeId: request.userId })
    ]).then(res => {
        let result = res[0];
        if (res[1]) {
            result.examineeId = res[1].examineeId;
            result.content.forEach(criteria => {
                criteria.answer = res[1].content.find(o => o._id.equals(criteria._id)).answer;
            });
        }
        return result;
    }).then(res => {
        response.json({ status: "OK", inquirer: res });
        console.debug('getInquirer', res);
    }).catch(err => {
        response.json({ status: "ERROR", error: err });
        console.error('getInquirer', err);
    });
}
