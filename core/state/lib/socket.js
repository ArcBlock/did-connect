const { WsClient } = require('@arcblock/ws');

// cache for all connections
const connections = {};

// create new connection
const createConnection = (endpoint) => {
  const wsEndpoint = endpoint.replace('https:', 'wss:').replace('http:', 'ws:');
  if (!connections[wsEndpoint]) {
    connections[wsEndpoint] = new WsClient(wsEndpoint, { heartbeatIntervalMs: 10 * 1000 });
  }

  if (connections[wsEndpoint].isConnected()) {
    return connections[wsEndpoint];
  }

  return new Promise((resolve, reject) => {
    connections[wsEndpoint].onOpen(() => {
      resolve(connections[wsEndpoint]);
    });

    connections[wsEndpoint].onError((err) => {
      reject(new Error(`Failed to connect to socket ${wsEndpoint}: ${err.message}`));
    });

    connections[wsEndpoint].connect();
  });
};

const destroyConnections = () => {
  Object.keys(connections).forEach((key) => {
    connections[key].disconnect();
    connections[key] = null;
  });
};

module.exports = {
  createConnection,
  destroyConnections,
};
