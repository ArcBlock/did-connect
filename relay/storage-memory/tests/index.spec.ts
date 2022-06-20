import MemoryStorage from '../src';

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

describe('MemoryStorage', () => {
  test('should be a function', () => {
    expect(typeof MemoryStorage).toEqual('function');
  });

  test('should extends event emitter', () => {
    const storage = new MemoryStorage();
    expect(typeof storage.on).toEqual('function');
    expect(typeof storage.emit).toEqual('function');
    expect(typeof storage.create).toEqual('function');
    expect(typeof storage.update).toEqual('function');
    expect(typeof storage.delete).toEqual('function');
    expect(typeof storage.read).toEqual('function');
  });

  test('should common workflow as expected', async () => {
    const storage = new MemoryStorage();

    let item = await storage.create('a', { strategy: 'default' });
    expect(item.strategy).toEqual('default');

    item = await storage.update('a', { strategy: 'default2' });
    expect(item.strategy).toEqual('default2');

    await storage.delete('a');

    item = await storage.read('a');
    expect(item).toBeFalsy();
  });

  test('should auto purge work as expected', async () => {
    const storage = new MemoryStorage({ ttl: 10 });

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
    const storage = new MemoryStorage({ ttl: 10 });

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
