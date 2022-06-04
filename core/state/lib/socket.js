const { WsClient } = require('@arcblock/ws');

// cache for all connections
const connections = {};

// create new connection
const createConnection = (endpoint) => {
  if (!connections[endpoint]) {
    connections[endpoint] = new WsClient(endpoint, { heartbeatIntervalMs: 10 * 1000 });
  }

  if (connections[endpoint].isConnected()) {
    return connections[endpoint];
  }

  return new Promise((resolve, reject) => {
    connections[endpoint].onOpen(() => {
      resolve(connections[endpoint]);
    });

    connections[endpoint].onError((err) => {
      reject(new Error(`Failed to connect to socket ${endpoint}: ${err.message}`));
    });

    connections[endpoint].connect();
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
