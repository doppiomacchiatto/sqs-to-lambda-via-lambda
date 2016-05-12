# SQS to Lambda (via Lambda)

There is currently not a native SQS event source for Lambda. This is
unfortunate. You can run something like https://github.com/robinjmurphy/sqs-to-lambda
but that requires running an instance, and who wants to do that?

Running a Lambda function (128MB) full-time costs about $5.39/month, and a t2.nano
(on demand) costs $4.68. Surely $0.71 is worth the coolness of not running a
boring EC2 instance. (There's a cheaper option too, keep reading.)

The supplied CloudFormation template will set up a Lambda function that reads
from SQS queues, and invokes Lambda functions with the payloads. By default it will
run a Lambda function continuously, polling your queues constantly for new items.

You can also configure it to poll your queues once a minute, reducing Lambda
costs to almost nothing, at the expense of waiting up to 60s to receive new queue
items.

One day, hopefully soon, Lambda will likely support SQS as a native event source,
and then this will be completely unnecessary. :fingerscrossed:

## Getting Started

First, create the CloudFormation stack. Inside a clone of this project:

```bash
aws --region us-east-1 cloudformation create-stack                            \
  --stack-name sqs-to-lambda                                                  \
  --template-body file://cloudformation.json                                  \
  --parameters 'ParameterKey=QueueToFunctionMapping,ParameterValue="<queue url 1>,<function 1>,<queue url 2>,<function 2>,..."' \
  --capabilities CAPABILITY_IAM
```

If you'd like the every-minute, cheaper option, add `ParameterKey=Frequency,ParameterValue=1Minute`
to the `--parameters` option.

You can also use the console, if you are so inclined.

Your functions specified in `QueueToFunctionMapping` will now receive everything
sent to their respective queues. The payload is an object with `source` set to
`aws.sqs` and `Message` as the actual message from SQS:

```json
{
    "source": "aws.sqs",
    "QueueUrl": "https://sqs.us-east-1.amazonaws.com/1234567/my-queue",
    "Message": {
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

### How does it work?

The supplied CloudFormation template will create a Lambda function that knows
how to pull from queues, and invoke other Lambda functions. The function is
triggered by CloudWatch Events, also set up by the CloudFormation template.

If you choose Continuous frequency, the function is invoked every 5 minutes, and
runs for almost 5 minutes, constantly polling.

If you choose 1Minute frequency, the function is invoked every minute, but exits
once the queue returns 0 items to process.

### What's up with the `cloudformation.yml` file?

Yaml is a much easier format to write these in. Trust me.

### What's up with the Javascript in `cloudformation.json`?

Embedding Javascript in the CloudFormation template is an easy way to make the
template self-contained. It also allows us to dynamically inject the configuration
into the SQS poller function. The javascript in the `cloudformation.json` file
is minimized from `sqs-to-lambda.js`.

We minimize the Javascript because there is a 2KB limit to inline code in
CloudFormation templates.

## Building

The `cloudformation.json` file is a build artifact - don't edit it directly!
To build:

```
$ npm install
$ npm run build
```

## Contributing

Make your changes, build a new `cloudformation.json` file (see above), and
submit a pull request.
