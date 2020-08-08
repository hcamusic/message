const topicToGrouping = {
  'hca-text-members': 3,
  'hca-text-men': 12,
  'hca-text-women': 13,
  'hca-text-barlock': 'barlock'
};

module.exports = async sns => {
  const snsTopics = await sns.listTopics().promise();

  return snsTopics.Topics.map(topic => ({
    ...topic,
    grouping: topicToGrouping[topic.TopicArn.split(':')[5]]
  }))
    .filter(topic => topic.grouping)
    .reduce((map, topic) => {
      map[topic.grouping] = topic.TopicArn;

      return map;
    }, {});
};
