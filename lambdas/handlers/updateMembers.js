const HarmonySite = require('harmonysite');
const AWS = require('aws-sdk');
const PhoneNumber = require('awesome-phonenumber');
const pDoWhilst = require('p-do-whilst');
const { forEachSeries } = require('p-iteration');
const snsGroupingToTopicArns = require('../snsGroupingToTopicArns');
const _ = require('lodash');

const sns = new AWS.SNS();
const harmonysite = new HarmonySite('https://www.hcamusic.org');

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

async function getActionsByTopicArn(grouping, topicArn) {

  const members = await harmonysite.members.list(grouping);
  const chorusMembers = _(members)
    .filter(member => member.cellPhone)
    .map(member => ({
      ...member,
      endpoint: new PhoneNumber(member.cellPhone, 'US').getNumber(
        'international'
      )
    }))
    .keyBy('endpoint')
    .value();

  console.log(`Processing ${Object.keys(chorusMembers).length} members for ${topicArn}`);

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
    `${topicArn}:\n  Adding ${endpointsToAdd.length}:\n    ${membersToAdd}` +
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
  await harmonysite.login(username, password);

  const groupingToTopicArn = await snsGroupingToTopicArns(sns);

  const actions = _.flatten(
    await Promise.all(
      _(groupingToTopicArn).map((topicArn, grouping) =>
        getActionsByTopicArn(grouping, topicArn)
      )
    )
  );

  await forEachSeries(actions, action => action.promise());

  return {};
};
