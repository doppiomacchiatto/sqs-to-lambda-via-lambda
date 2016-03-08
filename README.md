# SQS to Lambda (via Lambda)

There is currently not a native SQS event source for Lambda. This is
unfortunate. You can run something like https://github.com/robinjmurphy/sqs-to-lambda
but that requires running an instance, and who wants to do that?

Running a Lambda function (128MB) full-time costs about $5.39/month, and a t2.nano
(on demand) costs $4.68. Surely $0.71 is worth the coolness of not running a
boring EC2 instance.

The supplied CloudFormation template will set up a Lambda function that reads
from SQS queues, and invokes Lambda functions with the payloads.

One day, hopefully soon, Lambda will likely support SQS as a native event source,
and then this will be completely unnecessary. :fingerscrossed:

## Getting Started

First, create the CloudFormation stack:

 * Get the `cloudformation.json` file in this repository onto your hard drive
   somehow, either by cloning the repository or downloading the file directly
   from https://raw.githubusercontent.com/zwily/sqs-to-lambda-via-lambda/master/cloudformation.json.
 * Go to the CloudFormation console.
 * Click "Create Stack".
 * Under "Choose a template", select "Upload a template to Amazon S3".
 * Click "Choose File" and select the `cloudformation.json` file saved in the first step.
 * Click "Next".
 * Enter a "Stack name". I prefer "sqs-to-lambda".
 * For "1Queue", enter the *URL* of the SQS queue to poll.
 * For "1Function", enter the *name* of the Lambda function to invoke.
 * (Optionally enter up to 9 queue/function pairings.)
 * Click "Next".
 * Click "Next".
 * Click the "I acknowledge that this might..." checkbox.
 * Click "Create".
 * Bounce on the refresh button until the stack is created.

Now, you have to add the cron event source manually, since it is not supported
by CloudFormation yet:

 * Go to the Lambda console
 * Click on the new sqs-to-lambda function (elegantly named something like "sqs-to-lambda-LambdaFunction-FSAW1ZXGUJ9S")
 * Click "Event sources"
 * Click "Add event source"
 * Select "CloudWatch Events - Schedule" for "Event source type"
 * Enter `rate(5 minutes)` for "Schedule Expression"
 * Click "Submit"

Your function specified as 1Function will now receive everything sent to 1Queue.
The payload is an object with `source` set to `aws.sqs` and `message` as the actual
message from SQS:

```json
{
    "source": "aws.sqs",
    "message": {
        "MessageId": "2b2ea032-5d3d-4a17-b38c-92bece3ad7ce",
        "ReceiptHandle": "AQEB8t7sz7fgeAalKraYO3brB2+r0d3p18RE3G6J9k9GmRFODibL64oget5R6NaRJDoYrwHNtLutKOiY3Ggls2F6LRJFKLZhLbr3fSd+Hg6KiECu4tfdyAZxAwj2/X5QIieu0dtCMIEujHSDn7Xzz9L5hNW/uCB7Tx7Km0Sal077KE4h4CCHMvZDza8bNzmFTXvfRj5+odG80oLtir0w+lwx+DQYnkIZJxvVRLkfOspU2/84/ye4VZkr8pOD7xIGtgzU/Z7pdzTXeKw0WSfHQoQ661qBcqBHhMTjXXZ0WzsYHW1HPqtSwqA760nZfh0RXRjo9AGFsXYmtnQoFs64PCJ1hZ2u+N+azHChx4Ma+PtT6pgUfkCzrYG5Gq/BaR+RmPsW",
        "MD5OfBody": "abecffaa52f529a2b83b6612a7964b02",
        "Body": "{\"foo\":\"bar\"}"
    }
}
```

*NOTE:* Your Lambda function will need to delete the item from the queue using the given
`ReceiptHandle`! Otherwise, it will keep getting delivered.

## Questions

### What's up with the `cloudformation.yml` file?

Yaml is a much easier format to write these in. Trust me.

### Did you seriously write node code directly in the CloudFormation template?

Yes I did. What's it to you?

(If you have a better way to dynamically get the config into the Lambda
function, please let me know.)

## Contributing

Please only modify the `cloudformation.yml` file, run `make`, and commit
both the `cloudformation.*` files. Then submit a pull request.
