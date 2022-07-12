// @ts-ignore
import { WsClient } from '@arcblock/ws';

type Connections = { [key: string]: WsClient };

// cache for all connections
const connections: Connections = {};

// create new connection
export const createConnection = (endpoint: string): Promise<WsClient> => {
  if (!connections[endpoint]) {
    connections[endpoint] = new WsClient(endpoint, { heartbeatIntervalMs: 10 * 1000 });
  }

  if (connections[endpoint].isConnected()) {
    return Promise.resolve(connections[endpoint]);
  }

  return new Promise((resolve, reject) => {
    connections[endpoint].onOpen(() => {
      resolve(connections[endpoint]);
    });

    connections[endpoint].onError((err: any) => {
      reject(new Error(`Failed to connect to socket ${endpoint}: ${err.message}`));
    });

    connections[endpoint].connect();
  });
};

export const destroyConnections = () => {
  Object.keys(connections).forEach((key) => {
    if (connections[key].isConnected()) {
      connections[key].disconnect();
    }
    connections[key] = null;
  });
};
