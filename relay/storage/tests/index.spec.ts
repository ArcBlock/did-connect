import { BaseStorage } from '../src';

describe('RelayStorage', () => {
  test('should be a function', () => {
    expect(typeof BaseStorage).toEqual('function');
  });

  test('should extends event emitter', () => {
    const storage = new BaseStorage();
    expect(typeof storage.on).toEqual('function');
    expect(typeof storage.emit).toEqual('function');
    expect(typeof storage.create).toEqual('function');
    expect(typeof storage.update).toEqual('function');
    expect(typeof storage.delete).toEqual('function');
    expect(typeof storage.read).toEqual('function');
    expect(typeof storage.deleteFinalized).toEqual('function');
  });

  test('should extends event emitter', () => {
    const storage = new BaseStorage();
    expect(storage.isFinalized('error')).toEqual(true);
    expect(storage.isFinalized('timeout')).toEqual(true);
    expect(storage.isFinalized('rejected')).toEqual(true);
    expect(storage.isFinalized('canceled')).toEqual(true);
    expect(storage.isFinalized('walletConnected')).toEqual(false);
  });

  test('should throw error for not implemented methods', async () => {
    const storage = new BaseStorage({ ttl: 100 });
    try {
      // @ts-ignore
      storage.create();
      expect(false).toBeTruthy();
    } catch (err) {
      expect(err).toBeTruthy();
    }
    try {
      // @ts-ignore
      storage.update();
      expect(false).toBeTruthy();
    } catch (err) {
      expect(err).toBeTruthy();
    }
    try {
      // @ts-ignore
      storage.read();
      expect(false).toBeTruthy();
    } catch (err) {
      expect(err).toBeTruthy();
    }
    try {
      // @ts-ignore
      storage.delete();
      expect(false).toBeTruthy();
    } catch (err) {
      expect(err).toBeTruthy();
    }

    const result = await storage.deleteFinalized('x');
    expect(result).toBe(false);
  });
});
