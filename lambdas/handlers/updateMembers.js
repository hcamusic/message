const ChoirGenius = require('choirgenius');
const AWS = require('aws-sdk');
const PhoneNumber = require('awesome-phonenumber');
const pDoWhilst = require('p-do-whilst');
const { forEachSeries } = require('p-iteration');
const snsRoleToTopicArns = require('../snsRoleToTopicArns');
const _ = require('lodash');

const sns = new AWS.SNS();
const choirGenius = new ChoirGenius('https://hcamusic.org');

const username = process.env.CHOIR_GENIUS_USERNAME;
const password = process.env.CHOIR_GENIUS_PASSWORD;

async function listSubscriptionsByTopic(arn) {
  let subscriptions = [];
  let nextToken;

  await pDoWhilst(
    async () => {
      const params = { TopicArn: arn };

      if (nextToken) {
        params.NextToken = nextToken;
      }

      const result = await sns.listSubscriptionsByTopic(params).promise();

      subscriptions = subscriptions.concat(result.Subscriptions);
      nextToken = result.NextToken;
    },
    () => nextToken
  );

  return subscriptions;
}

async function getActionsByTopicArn(role, topicArn, chorusMembers) {
  const subscriptions = await listSubscriptionsByTopic(topicArn);

  const subscriptionEndpoints = _(subscriptions)
    .map(subscription => ({
      ...subscription,
      Endpoint: new PhoneNumber(subscription.Endpoint).getNumber(
        'international'
      )
    }))
    .keyBy('Endpoint')
    .value();

  const expectedSubscriptions = _(chorusMembers)
    .filter(member => member.roles.includes(role))
    .filter(member => !member.roles.includes("Inactive Member"))
    .map(member => member.endpoint)
    .value();

  const actualSubscriptions = _(subscriptionEndpoints)
    .map(sub => sub.Endpoint)
    .value();

  const endpointsToAdd = _.difference(
    expectedSubscriptions,
    actualSubscriptions
  );

  const mapDisplayEndpoints = endpoint => {
    const member = chorusMembers[endpoint] || {firstName: "", lastName: ""};

    return `(${endpoint}) ${member.firstName} ${member.lastName}`;
  };

  const endpointsToRemove = _.difference(
    actualSubscriptions,
    expectedSubscriptions
  );

  const membersToAdd = endpointsToAdd.map(mapDisplayEndpoints).join("\n    ");
  const membersToRemove = endpointsToRemove.map(mapDisplayEndpoints).join("\n    ");

  console.log(
    `${role}:\n  Adding ${endpointsToAdd.length}:\n    ${membersToAdd}` +
    `\n  Removing ${endpointsToRemove.length}:\n    ${membersToRemove}`
  );

  return []
    .concat(
      endpointsToAdd.map(endpoint =>
        sns.subscribe({
          TopicArn: topicArn,
          Protocol: 'sms',
          Endpoint: endpoint
        })
      )
    )
    .concat(
      endpointsToRemove.map(endpoint =>
        sns.unsubscribe({
          SubscriptionArn: subscriptionEndpoints[endpoint].SubscriptionArn
        })
      )
    );
}

module.exports.handler = async () => {
  await choirGenius.login(username, password);

  const members = await choirGenius.getMembers();
  const chorusMembers = _(members)
    .filter(member => member.roles.includes('Member') && member.mobilePhone)
    .map(member => ({
      ...member,
      roles: member.roles,
      endpoint: new PhoneNumber(member.mobilePhone, 'US').getNumber(
        'international'
      )
    }))
    .keyBy('endpoint')
    .value();

  console.log(`Processing ${Object.keys(chorusMembers).length} members`);

  const roleToTopicArn = await snsRoleToTopicArns(sns);

  const actions = _.flatten(
    await Promise.all(
      _(roleToTopicArn).map((topicArn, role) =>
        getActionsByTopicArn(role, topicArn, chorusMembers)
      )
    )
  );

  await forEachSeries(actions, action => action.promise());

  return {};
};
