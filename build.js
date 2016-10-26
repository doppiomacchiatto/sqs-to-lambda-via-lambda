var UglifyJS = require("uglify-js");
var fs = require('fs');

try {
  var sqsToLambdaCode = UglifyJS.minify('./src/sqs-to-lambda.js', {
    mangle: { 'toplevel': true }
  }).code;
} catch (e) {
  console.log("Caught error minifying", e);
}

var templateBody = fs.readFileSync('./src/cloudformation.yml', 'utf-8');
var builtTemplate = templateBody.replace('{SQSToLambdaCode}', sqsToLambdaCode);
fs.writeFileSync('./sqs-to-lambda.yml', builtTemplate);
