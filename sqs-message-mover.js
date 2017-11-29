#!/usr/bin/env node
const AWS = require('aws-sdk');
const Consumer = require('sqs-consumer');
const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['respool'],
  alias: {
    'i': 'in-queue',
    'o': 'out-queue',
    'r': 'respool',
    'k': 'aws-access-key-id',
    's': 'aws-secret-access-key',
    't': 'timeout'
  }
});

// read env variables / arguments
const AWS_ACCESS_KEY_ID = argv['aws-access-key-id'] || process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = argv['aws-secret-access-key'] || process.env.AWS_SECRET_ACCESS_KEY;
const AWS_DEFAULT_REGION = argv['region'] || process.env.AWS_DEFAULT_REGION;
const IN_QUEUE = argv['in-queue'];
const OUT_QUEUE = argv['out-queue'];
const RESPOOL = argv['respool'];
const TIMEOUT = argv['timeout'] || 60;

// validate arguments
console.log(`AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}`);
console.log(`AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY? 'provided' : 'missing'}`);
console.log(`AWS_DEFAULT_REGION: ${AWS_DEFAULT_REGION}`);
console.log(`IN_QUEUE: ${IN_QUEUE}`);
console.log(`OUT_QUEUE: ${OUT_QUEUE}`);
console.log(`RESPOOL: ${RESPOOL}`);
console.log(`TIMEOUT: ${TIMEOUT}`);

if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && AWS_DEFAULT_REGION && IN_QUEUE && (OUT_QUEUE || RESPOOL)) {
  AWS.config.update({
    region: AWS_DEFAULT_REGION,
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  });

  const SQS = new AWS.SQS();

  const app = Consumer.create({
    queueUrl: IN_QUEUE,
    batchSize: 10,
    handleMessage: (message, done) => {
      console.log(message.Body);
      SQS.sendMessage({
        DelaySeconds: TIMEOUT,
        QueueUrl: RESPOOL ? IN_QUEUE : OUT_QUEUE,
        MessageBody: message.Body
      }, (err, data) => {
        if (err) console.log(err);
        done(err);
      });
    },
    sqs: SQS
  });

  app.on('error', (err) => {
    console.log(err.message);
  });
  
  const timer = setTimeout(() => {
    app.stop();
    console.log('App timeout');
  }, TIMEOUT * 1000);

  app.on('empty', () => {
    app.stop();
    clearTimeout(timer);
    console.log('finished');
  });

  app.start();


} else {
  console.log(`SQS Message mover
Usage:
  -i, --input-queue QUEUE_URL     | The URL of the queue you want to read from
  -o, --output-queue QUEUE_URL    | The URL of the queue you want to write to
      --region REGION             | AWS region to use e.g. eu-west-1
  -k, --aws-access-key-id KEY_ID  | Your access key ID
  -s, --aws-secret-access-key KEY | Your secret access key
  -r, --respool                   | Read and write to the same queue. Use to reset waiting times
  -t, --timeout SECONDS           | Keep moving messages for this number of seconds
  `);
}