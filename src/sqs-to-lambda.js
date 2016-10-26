/* Two global variables should already be injected by the CloudFormation template:
 *
 * CONFIG (String) The comma-separated list of queue url/lambda function pairs.
 * ONCE (Bool) True if the function should exit after polling each queue a single
 *             time. If False, the function will keep polling until it nears timeout.
 * CONCURRENCY (Integer) How many simultaneous Lambda functions should be invoked
 *                       per mapping.
 */

const AWS = require('aws-sdk');
const sqs = new AWS.SQS();
const lambda = new AWS.Lambda();

function pollQueue(queueUrl, functionName, remaining, done) {
  if (remaining() < 5000) {
    return done();
  }

  if (queueUrl == "" || functionName == "") {
    return done();
  }

  sqs.receiveMessage({
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 1
  }, function(err, data) {
    if (err) {
      console.log("error receiving messages", err);
      return done();
    }

    if (!data.Messages || data.Messages.length === 0) {
      if (ONCE) {
        return done();
      }

      return pollQueue(queueUrl, functionName, remaining, done);
    }

    lambda.invoke({
      FunctionName: functionName,
      InvocationType: "RequestResponse",
      Payload: JSON.stringify({
        source: "aws.sqs",
        QueueUrl: queueUrl,
        Message: data.Messages[0]
      })
    }, function(err) {
      if (err) {
        console.log("error invoking function", err);
        return done();
      }

      return pollQueue(queueUrl, functionName, remaining, done);
    });
  });
}

exports.handler = function(event, context, callback) {
  const config = CONFIG;
  if (config.length === 0) {
    return callback();
  }

  var remainingWorkers = config.length / 2 * CONCURRENCY;
  const done = function() {
    remainingWorkers = remainingWorkers - 1;
    if (remainingWorkers === 0) {
      callback();
    }
  }

  for (var i = 0; i < config.length; i += 2) {
    for (var j = 0; j < CONCURRENCY; j++) {
      pollQueue(config[i], config[i + 1], context.getRemainingTimeInMillis, done);
    }
  }
}
