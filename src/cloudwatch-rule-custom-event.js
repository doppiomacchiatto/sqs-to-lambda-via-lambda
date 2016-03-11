var AWS = require('aws-sdk');
var events = new AWS.CloudWatchEvents();
var response = require('cfn-response');

exports.handler = function(event, context) {
  var targetFunction = event.ResourceProperties.TargetFunction;
  var ruleName = event.ResourceProperties.RuleNamePrefix + targetFunction;

  if (event.RequestType === 'Create' || event.RequestType === 'Update') {
    events.putRule({
      Name: ruleName,
      ScheduleExpression: event.ResourceProperties.ScheduleExpression,
      State: "ENABLED"
    }, function(err, data) {
      if (err) {
        console.log(err);
        response.send(event, context, response.FAILED, {});
        return;
      }

      var ruleArn = data.RuleArn;
      events.putTargets({
        Rule: ruleName,
        Targets: [{
          Id: ruleName,
          Arn: event.ResourceProperties.TargetFunctionArn
        }]
      }, function(err, data) {
        if (err) {
          console.log(err);
          response.send(event, context, response.FAILED, {});
          return;
        }

        response.send(event, context, response.SUCCESS, {
          RuleArn: ruleArn
        }, ruleName);
      })
    });
  } else if (event.RequestType === 'Delete') {
    events.removeTargets({
      Rule: ruleName,
      Ids: [ ruleName ]
    }, function(err, data) {
      if (err) {
        console.log(err);
        response.send(event, context, response.FAILED, {});
        return;
      }

      events.deleteRule({
        Name: ruleName
      }, function(err, data) {
        if (err) {
          console.log(err);
          response.send(event, context, response.FAILED, {});
          return;
        }

        response.send(event, context, response.SUCCESS, {}, ruleName);
      })
    });
  }
}
