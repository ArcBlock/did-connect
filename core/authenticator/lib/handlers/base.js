const { EventEmitter } = require('events');

class BaseHandler extends EventEmitter {
  /**
   * Creates an instance of DID Auth Handlers.
   *
   * @class
   * @param {object} config
   * @param {function} config.pathTransformer - function to transform path when generate action;
   * @param {object} config.tokenStorage - function to generate action token
   * @param {object} config.authenticator - Authenticator instance that can to jwt sign/verify
   * @param {function} [config.onConnect=noop] - function called when wallet selected did
   */
  constructor({ pathTransformer, tokenStorage, authenticator, onConnect }) {
    super();

    this.authenticator = authenticator;
    this.tokenStorage = tokenStorage;

    // Handle events from Auth Token Storage
    this.tokenStorage.on('create', (data) => this.emit('created', data));
    this.tokenStorage.on('destroy', (token) => this.emit('deleted', { token }));
    this.tokenStorage.on('update', async (data) => {
      if (!data) {
        return;
      }

      const events = {
        scanned: 'scanned',
        succeed: 'succeed',
        forbidden: 'failed',
        error: 'failed',
      };

      if (events[data.status]) {
        const payload = await this.tokenStorage.read(data.token);
        this.emit(events[data.status], payload);
      }
    });

    if (typeof pathTransformer === 'function') {
      this.pathTransformer = pathTransformer;
    } else {
      this.pathTransformer = (v) => v;
    }

    if (typeof onConnect === 'function') {
      this.onConnect = onConnect;
    } else {
      this.onConnect = () => {};
    }
  }
}

module.exports = BaseHandler;
