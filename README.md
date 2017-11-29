# sqs-message-mover

Move messages between SQS queues, or respool messages to renew their age.

I'm sure there's already something on the Internet that does this same thing, but I wanted to do it myself.

## Parameters
```
  -i, --input-queue QUEUE_URL     | The URL of the queue you want to read from
  -o, --output-queue QUEUE_URL    | The URL of the queue you want to write to
      --region REGION             | AWS region to use e.g. eu-west-1
  -k, --aws-access-key-id KEY_ID  | Your access key ID
  -s, --aws-secret-access-key KEY | Your secret access key
  -r, --respool                   | Read and write to the same queue. Use to reset waiting times
```

## Usage examples

For both examples, you need to provide an AWS access key. This key needs to have both read and write access to the queues in question.

You may also provide AWS credentials in your system environment using the environment variables `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` AND `AWS_DEFAULT_REGION`.

### Reload messages from a Dead Letter Queue

If you're making use of the SQS redrive policy, successive failed messages will get moved to a DLQ (dead letter queue). AWS doesn't provide an easy way of moving those messages back to the input queue.

```bash
$ ./sqs-message-mover.js \
    --aws-access-key-id YOUR_KEY_ID \
    --aws-secret-access-key YOUR_ACCESS_KEY \
    --region eu-west-2 \
    --in-queue https://sqs.eu-west-2.amazonaws.com/ACCOUNT_NUMBER/YOUR_DLQ \
    --out-queue https://sqs.eu-west-2.amazonaws.com/ACCOUNT_NUMBER/YOUR_QUEUE
```

### Respool messages on a queue

Messages on SQS have a maximum lifetime. If they remain on a queue above the queue's configured amount of time, they'll expire and silently disappear. Check the queue configuration in the SQS console: the message retention period is 4 days by default, but can be configured for up to 14 days. Run this command before their expiry to reset the timer.

```bash
$ ./sqs-message-mover.js \
    --aws-access-key-id YOUR_KEY_ID \
    --aws-secret-access-key YOUR_ACCESS_KEY \
    --region eu-west-2 \
    --in-queue https://sqs.eu-west-2.amazonaws.com/ACCOUNT_NUMBER/YOUR_QUEUE \
    --respool
```
