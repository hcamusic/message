const ChoirGenius = require('choirgenius');
const AWS = require('aws-sdk');
const PhoneNumber = require('awesome-phonenumber');
const snsRoleToTopicArns = require('../snsRoleToTopicArns');

const sns = new AWS.SNS();
const choirGenius = new ChoirGenius('https://hcamusic.org');

const username = process.env.CHOIR_GENIUS_USERNAME;
const password = process.env.CHOIR_GENIUS_PASSWORD;

// TODO: Update topic subscriptions
module.exports.handler = async (event, context) => {
  // await choirGenius.login(username, password);
  //
  // const members = await choirGenius.getMembers();
  // const chorusMembers = members.filter(member =>
  //   member.roles.includes('Member')
  // );

  // console.log(JSON.stringify(chorusMembers, null, 2));

  const roleToTopicArn = await snsRoleToTopicArns(sns);

  await sns
    .subscribe({
      TopicArn: roleToTopicArn['Member'],
      Protocol: 'sms',
      Endpoint: new PhoneNumber('(919) 426-8744', 'US').getNumber(
        'international'
      )
    })
    .promise();

  return {};
};
