const AWS = require('aws-sdk');
const snsGroupingToTopicArn = require('../snsGroupingToTopicArn');

const sns = new AWS.SNS();

const authToken = process.env.AUTH_TOKEN;

const responseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
};

module.exports.handler = async event => {
  console.log(JSON.stringify(event, null, 2));

  const data = JSON.parse(event.body);

  if (data.auth !== authToken) {
    return {
      statusCode: 401,
      headers: responseHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Incorrect Password'
      })
    };
  }

  if (!data.message || !data.role) {
    return {
      statusCode: 400,
      headers: responseHeaders,
      body: JSON.stringify({
        success: false,
        error: 'No `body` or `role` provided'
      })
    };
  }

  const grouping = await snsGroupingToTopicArn(sns);

  await sns
    .publish({
      TopicArn: grouping[data.grouping],
      Message: `HCA: ${data.message}`
    })
    .promise();

  return {
    statusCode: 200,
    headers: responseHeaders,
    body: JSON.stringify({ success: true })
  };
};
