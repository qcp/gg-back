const { getParameters } = require('../utils/aggregations');
const { getDashboard } = require('../utils/aggregations');

module.exports.updateInquirer = (request, response) => {
    request.app.locals.inquirers.updateOne(
        { _id: request.body._id },
        { $set: request.body },
        { upsert: true })
        .then(res => {
            response.json({ status: "OK" });
            console.debug('updateInquirer', res);
        }).catch(err => {
            response.json({ status: "ERROR", error: err });
            console.error('updateInquirer', err);
        });
}
module.exports.getInquirer = (request, response) => {
    request.app.locals.inquirers.findOne(
        { _id: request.query._id })
        .then(res => {
            response.json({ status: "OK", inquirer: res });
            console.debug('getInquirer', res);
        }).catch(err => {
            response.json({ status: "ERROR", error: err });
            console.error('getInquirer', err);
        });
}

module.exports.updateExaminees = (request, response) => {
    let promises = [];
    request.body.forEach(examinee => {
        promises.push(request.app.locals.users.updateOne(
            { _id: examinee._id },
            { $set: examinee },
            { upsert: true }
        ));
    });
    Promise.all(promises).then(res => {
        response.json({ status: "OK" });
        console.debug('updateExaminees', res);
    }).catch(err => {
        response.json({ status: "ERROR", error: err });
        console.error('updateExaminees', err);
    });
}
module.exports.getExaminees = (request, response) => {
    let examinees = [];
    request.app.locals.inquirers.findOne(
        { _id: request.query._id },
        { projection: { 'examinees': 1 } }
    ).then(res => {
        if (!res) throw 'Not found';

        res.examinees.forEach(examinee => {
            examinees.push(examinee._id);
        });

        return request.app.locals.users.find({ _id: { $in: examinees } }).toArray();
    }).then(res => {
        response.json({ status: "OK", examinees: res });
        console.debug('getExaminees', res);
    }).catch(err => {
        response.json({ status: "ERROR", error: err });
        console.error('getExaminees', err);
    });
}

module.exports.updateReviewers = (request, response) => {
    let promises = [];
    request.body.users.forEach(reviewer => {
        promises.push(request.app.locals.users.updateOne(
            { _id: reviewer._id },
            { $set: reviewer },
            { upsert: true }
        ));
    });
    request.body.groups.forEach(reviewer => {
        promises.push(request.app.locals.groups.updateOne(
            { _id: reviewer._id },
            { $set: reviewer },
            { upsert: true }
        ));
    });
    request.body.apis.forEach(reviewer => {
        promises.push(request.app.locals.apis.updateOne(
            { _id: reviewer._id },
            { $set: reviewer },
            { upsert: true }
        ));
    });
    Promise.all(promises).then(res => {
        response.json({ status: "OK" });
        console.debug('updateReviewers', res);
    }).catch(err => {
        response.json({ status: "ERROR", error: err });
        console.error('updateReviewers', err);
    });
}
module.exports.getReviewers = (request, response) => {
    let reviewers = [];

    request.app.locals.inquirers.findOne(
        { _id: request.query._id },
        { projection: { 'content.reviewerChain': 1 } })
        .then(res => {
            if (!res) throw 'Not found';

            res.content.forEach(criteria => {
                criteria.reviewerChain.forEach(chainLink => {
                    reviewers.push(...chainLink.reviewers);
                });
            });

            return request.app.locals.groups.find({ _id: { $in: reviewers } }).toArray();
        }).then(groups => {
            groups.forEach(group => {
                reviewers.push(...group.reviewers);
            });

            return Promise.all([
                request.app.locals.users.find({ _id: { $in: reviewers } }).toArray(),
                groups,
                request.app.locals.apis.find({ _id: { $in: reviewers } }).toArray()
            ]);
        }).then(res => {
            response.json({
                status: "OK", reviewers: {
                    users: res[0],
                    groups: res[1],
                    apis: res[2]
                }
            });
            console.debug('getReviewers', res);
        }).catch(err => {
            response.json({ status: "ERROR", error: err });
            console.error('getReviewers', err);
        });
}


module.exports.getDashboard = (request, response) => {
    request.app.locals.inquirers.aggregate(getDashboard(request.userId)).toArray()
        .then(res => {
            response.json({ status: "OK", dashboard: res });
            console.debug('getDashboard', res);
        }).catch(err => {
            response.json({ status: "ERROR", error: err });
            console.error('getDashboard', err);
        });
}

module.exports.getResults = (request, response) => {
    request.app.locals.answers.aggregate(getParameters(request.query._id)).next()
        .then(res => {
            response.json({ status: "OK", table: res });
            console.debug('getResults', res);
        }).catch(err => {
            response.json({ status: "ERROR", error: err });
            console.error('getResults', err);
        });
}