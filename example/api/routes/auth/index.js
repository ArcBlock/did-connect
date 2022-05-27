const { handlers } = require('../../libs/auth');
const testHandler = require('./test');

module.exports = {
  init(app) {
    handlers.attach({ app, ...testHandler });
  },
};
