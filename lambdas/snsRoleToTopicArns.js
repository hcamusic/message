const topicToRole = {
  'hca-text-board': 'Board Member',
  'hca-text-members': 'Member',
  'hca-text-men': "Men's Ensemble",
  'hca-text-women': 'Ladies',
  'hca-text-communications': 'Communications Committee',
  'hca-text-barlock': 'Barlock'
};

module.exports = async sns => {
  const snsTopics = await sns.listTopics().promise();

  return snsTopics.Topics.map(topic => ({
    ...topic,
    role: topicToRole[topic.TopicArn.split(':')[5]]
  }))
    .filter(topic => topic.role)
    .reduce((map, topic) => {
      map[topic.role] = topic.TopicArn;

      return map;
    }, {});
};
