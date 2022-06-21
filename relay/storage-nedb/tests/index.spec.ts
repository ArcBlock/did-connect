import os from 'os';
import path from 'path';
import { NedbStorage } from '../src';

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

describe('NedbStorage', () => {
  const dbDir = path.join(os.tmpdir(), Date.now().toString());

  test('should extends event emitter', () => {
    // @ts-ignore
    expect(() => new NedbStorage({})).toThrow();

    const storage = new NedbStorage({ dbPath: path.join(dbDir, '1.db') });
    expect(typeof storage.on).toEqual('function');
    expect(typeof storage.emit).toEqual('function');
    expect(typeof storage.create).toEqual('function');
    expect(typeof storage.update).toEqual('function');
    expect(typeof storage.delete).toEqual('function');
    expect(typeof storage.read).toEqual('function');
  });

  test('should common workflow as expected', async () => {
    const storage = new NedbStorage({ dbPath: path.join(dbDir, '2.db') });

    let item = await storage.create('a', { strategy: 'default' });
    expect(item.strategy).toEqual('default');

    item = await storage.update('a', { strategy: 'default2' });
    expect(item.strategy).toEqual('default2');

    await storage.delete('a');

    item = await storage.read('a');
    expect(item).toBeFalsy();
  });

  test('should auto purge work as expected', async () => {
    const storage = new NedbStorage({ dbPath: path.join(dbDir, '3.db'), ttl: 10 });

    let item = await storage.create('b', { strategy: 'default' });
    expect(item.strategy).toEqual('default');

    item = await storage.update('b', { strategy: 'default2' });
    expect(item.strategy).toEqual('default2');

    item = await storage.update('b', { status: 'error' });
    expect(item.strategy).toEqual('default2');
    expect(item.status).toEqual('error');

    await sleep(50);

    item = await storage.read('a');
    expect(item).toBeFalsy();
  });

  test('should clear work as expected', async () => {
    const storage = new NedbStorage({ dbPath: path.join(dbDir, '4.db'), ttl: 10 });

    await storage.create('c', { strategy: 'default' });
    await storage.create('d', { strategy: 'default' });

    await storage.clear();

    await sleep(50);

    let item = await storage.read('c');
    expect(item).toBeFalsy();

    item = await storage.read('d');
    expect(item).toBeFalsy();
  });
});
