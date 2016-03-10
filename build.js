var yaml = require('js-yaml');
var UglifyJS = require("uglify-js");
var fs = require('fs');

var sqsToLambda = UglifyJS.minify('./sqs-to-lambda.js').code;
var cloudwatchRule = UglifyJS.minify('./cloudwatch-rule-custom-event.js').code;

var templateBody = fs.readFileSync('./cloudformation.yml', 'utf-8');
var template = yaml.safeLoad(templateBody);

template.Resources.SetupCloudwatchEventsFunction.Properties.Code.ZipFile = cloudwatchRule;

var ary = template.Resources.SQSToLambdaFunction.Properties.Code.ZipFile['Fn::Join'][1]
ary[ary.length - 1] = sqsToLambda;

fs.writeFileSync('./cloudformation.json', JSON.stringify(template, null, '  '), 'utf-8');
