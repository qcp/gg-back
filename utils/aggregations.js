module.exports.getCriterias = (inquirerId) => [
  { '$match': { '_id': inquirerId } },
  { '$unwind': { 'path': '$content', 'preserveNullAndEmptyArrays': true } },
  {
    '$lookup': {
      'from': 'answers',
      'let': {
        'inquirerId': '$_id',
        'contentId': '$content._id'
      },
      'pipeline': [
        { '$match': { '$expr': { '$eq': ['$inquirerId', '$$inquirerId'] } } },
        { '$unwind': { 'path': '$content', 'preserveNullAndEmptyArrays': true } },
        { '$match': { '$expr': { '$eq': ['$content._id', '$$contentId'] } } }
      ],
      'as': 'answer'
    }
  },
  { '$unwind': { 'path': '$answer', 'preserveNullAndEmptyArrays': true } },
  {
    '$addFields': {
      'examineeId': '$answer.examineeId',
      'content': { '$mergeObjects': ['$content', '$answer.content'] }
    }
  },
  {
    '$lookup': {
      'from': 'users',
      'localField': 'examineeId',
      'foreignField': '_id',
      'as': 'examinee'
    }
  },
  { '$unwind': { 'path': '$examinee' } },
  { '$project': { 'content': 1, 'examinee': 1 } }
]

module.exports.getParameters = (inquirerId) => [
  {
    '$match': {
      'inquirerId': inquirerId
    }
  }, {
    '$unwind': {
      'path': '$content',
      'preserveNullAndEmptyArrays': true
    }
  }, {
    '$addFields': {
      'decision': {
        '$arrayElemAt': [
          '$content.decisionChain', -1
        ]
      }
    }
  }, {
    '$unwind': {
      'path': '$decision.parameters',
      'preserveNullAndEmptyArrays': true
    }
  }, {
    '$addFields': {
      'parameter': '$decision.parameters'
    }
  }, {
    '$sort': {
      'parameter.name': 1
    }
  }, {
    '$group': {
      '_id': {
        'inquirerId': '$inquirerId',
        'examineeId': '$examineeId'
      },
      'parameters': {
        '$push': '$parameter'
      }
    }
  }, {
    '$lookup': {
      'from': 'users',
      'localField': '_id.examineeId',
      'foreignField': '_id',
      'as': 'examinee'
    }
  }, {
    '$unwind': {
      'path': '$examinee',
      'preserveNullAndEmptyArrays': true
    }
  }, {
    '$addFields': {
      'result.examinee': '$examinee',
      'result.parameters': '$parameters'
    }
  }, {
    '$group': {
      '_id': '$_id.inquirerId',
      'results': {
        '$push': '$result'
      }
    }
  }, {
    '$lookup': {
      'from': 'inquirers',
      'let': {
        'inquirerId': '$_id'
      },
      'pipeline': [
        {
          '$match': {
            '$expr': {
              '$eq': [
                '$_id', '$$inquirerId'
              ]
            }
          }
        }, {
          '$unwind': {
            'path': '$content',
            'preserveNullAndEmptyArrays': true
          }
        }, {
          '$unwind': {
            'path': '$content.parameters',
            'preserveNullAndEmptyArrays': true
          }
        }, {
          '$addFields': {
            'parameter': '$content.parameters'
          }
        }, {
          '$sort': {
            'parameter.name': 1
          }
        }, {
          '$group': {
            '_id': '$_id',
            'parameters': {
              '$push': '$parameter'
            }
          }
        }
      ],
      'as': 'headers'
    }
  }, {
    '$unwind': {
      'path': '$headers',
      'preserveNullAndEmptyArrays': true
    }
  }, {
    '$addFields': {
      'headers': '$headers.parameters'
    }
  }
]

module.exports.getDashboard = (createUserId) => [
  { '$match': { 'metadata.createUserId': createUserId } },
  {
    '$lookup': {
      'from': 'answers',
      'localField': '_id',
      'foreignField': 'inquirerId',
      'as': 'answers'
    }
  },
  {
    '$addFields': {
      'statistics.all': { '$size': '$examinees' },
      'statistics.draft': {
        '$size': {
          '$filter': {
            'input': '$answers',
            'as': 'item',
            'cond': { '$eq': ['$$item.state', 'draft'] }
          }
        }
      },
      'statistics.done': {
        '$size': {
          '$filter': {
            'input': '$answers',
            'as': 'item',
            'cond': { '$eq': ['$$item.state', 'done'] }
          }
        }
      }
    }
  },
  { '$project': { 'content': 0, 'examinees': 0 } },
  {
    '$addFields': {
      'statistics.none': {
        '$subtract': ['$statistics.all', { '$add': ['$statistics.done', '$statistics.draft'] }]
      }
    }
  }
]
