const fetch = require('node-fetch');
const { getCriterias } = require('./aggregations');

const updateReviewerNext = (db, inquirerId, examineeId, criteriasId) => {
    db.inquirers.aggregate(getCriterias(inquirerId))
        .match({ $expr: { $and: [{ $in: ['$content._id', criteriasId] }, { $eq: ['$examinee._id', examineeId] }] } })
        .forEach(async ({ content, examinee, }) => {
            let nextStep = 0;
            if (content.reviewerNext && content.decisionChain.length) {
                nextStep = +content.decisionChain[content.decisionChain.length - 1].step + 1;
            }
            if (nextStep < content.reviewerChain.length) {
                const groups = await db.groups.find({ _id: { $in: content.reviewerChain[nextStep].reviewers } }).toArray();
                let usersId = content.reviewerChain[nextStep].reviewers;
                groups.forEach(group => usersId.push(...group.reviewers));
                const users = await db.users.find({ _id: { $in: usersId } }).toArray();

                const apis = await db.apis.find({ _id: { $in: content.reviewerChain[nextStep].reviewers } }).toArray();

                await db.answers.findOneAndUpdate(
                    { inquirerId: inquirerId, examineeId: examineeId, 'content._id': content._id },
                    { $set: { 'content.$.reviewerNext': { step: nextStep, users: users.map(user => user._id), apis: apis.map(api => api._id) } } }
                );

                if (apis.length) {
                    const body = {
                        examinee: examinee,
                        settings: content.settings,
                        answer: content.answer,
                        parameters: content.parameters
                    };
                    const req = await fetch(apis[0].url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json;charset=utf-8' },
                        body: JSON.stringify(body)
                    });

                    let comment = '';
                    let parameters = [];

                    if (req.ok) {
                        const res = await req.json();
                        if (res.status == 'OK') {
                            comment = res.decision.comment;
                            parameters = res.decision.parameters;
                        }
                        else {
                            comment = res.error;
                        }
                    }
                    else {
                        comment = req.statusText;
                    }

                    await db.answers.findOneAndUpdate(
                        { inquirerId: inquirerId, examineeId: examineeId, 'content._id': content._id },
                        { $push: { 'content.$.decisionChain': { reviewerId: apis[0]._id, date: new Date(), step: nextStep, comment: comment, parameters: parameters } } }
                    );
                    await updateReviewerNext(db, inquirerId, examineeId, [content._id]);
                }
            }
            else {
                await db.answers.findOneAndUpdate({ inquirerId: inquirerId, examineeId: examineeId, 'content._id': content._id },
                    { $set: { 'content.$.reviewerNext': { step: -1, users: [], apis: [] } } });
            }

        })
}

module.exports.updateReviewerNext = updateReviewerNext;