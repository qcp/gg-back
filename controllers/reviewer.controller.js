const { updateReviewerNext } = require("../utils/common");
const { getCriterias } = require('../utils/aggregations');

module.exports.updateAnswer = (request, response) => {
    request.app.locals.answers.findOneAndUpdate(
        { inquirerId: request.body.inquirerId, examineeId: request.body.examineeId, 'content._id': request.body.criteriaId },
        { $push: { 'content.$.decisionChain': request.body.decision } }
    ).then(res => {
        response.json({ status: "OK" });
        console.debug('updateAnswer', res);
        updateReviewerNext(request.app.locals, request.body.inquirerId, request.body.examineeId, [request.body.criteriaId]);
    }).catch(err => {
        response.json({ status: "ERROR", error: err });
        console.error('updateAnswer', err);
    });
}

module.exports.getAnswers = (request, response) => {
    request.app.locals.inquirers.aggregate(getCriterias(request.query._id))
        .match({ $expr: { $and: [{ $eq: ['$answerState', 'done'] }, { $in: [request.userId, '$content.reviewerNext.users'] }] } })
        .lookup({ from: 'users', localField: 'content.decisionChain.reviewerId', foreignField: '_id', as: 'reviewers' })
        .lookup({ from: 'apis', localField: 'content.decisionChain.reviewerId', foreignField: '_id', as: 'apis' }).toArray()
        .then(res => {
            response.json({ status: "OK", answers: res });
            console.debug('getInquirer', res);
        }).catch(err => {
            response.json({ status: "ERROR", error: err });
            console.error('getInquirer', err);
        });
}
