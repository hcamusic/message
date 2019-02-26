const packageInfo = require('./package.json');

module.exports = {
  assetPrefix: process.env.NODE_ENV === 'production' ? `/${packageInfo.name}` : '',
  generateBuildId: () =>
    require('child_process')
      .execSync('git rev-parse HEAD')
      .toString()
      .trim()
};
