import { ref, shallowRef, unref } from 'vue';
import Cookie from 'js-cookie';
import { getCookieOptions } from '@arcblock/ux/src/Util';
import { pausableWatch } from '@vueuse/core';

function guessSerializerType(rawInit) {
  return rawInit == null
    ? 'any'
    : rawInit instanceof Set
    ? 'set'
    : rawInit instanceof Map
    ? 'map'
    : rawInit instanceof Date
    ? 'date'
    : typeof rawInit === 'boolean'
    ? 'boolean'
    : typeof rawInit === 'string'
    ? 'string'
    : typeof rawInit === 'object'
    ? 'object'
    : Array.isArray(rawInit)
    ? 'object'
    : !Number.isNaN(rawInit)
    ? 'number'
    : 'any';
}

const StorageSerializers = {
  boolean: {
    read: (v) => v === 'true',
    write: (v) => String(v),
  },
  object: {
    read: (v) => JSON.parse(v),
    write: (v) => JSON.stringify(v),
  },
  number: {
    read: (v) => Number.parseFloat(v),
    write: (v) => String(v),
  },
  any: {
    read: (v) => v,
    write: (v) => String(v),
  },
  string: {
    read: (v) => v,
    write: (v) => String(v),
  },
  map: {
    read: (v) => new Map(JSON.parse(v)),
    write: (v) => JSON.stringify(Array.from(v.entries())),
  },
  set: {
    read: (v) => new Set(JSON.parse(v)),
    write: (v) => JSON.stringify(Array.from(v)),
  },
  date: {
    read: (v) => new Date(v),
    write: (v) => v.toISOString(),
  },
};

export default (key, initialValue, cookieOpt = {}, options = {}) => {
  const {
    flush = 'pre',
    deep = true,
    listenToStorageChanges = true,
    writeDefaults = true,
    shallow,
    eventFilter,
    onError = (e) => {
      console.error(e);
    },
  } = options;
  const data = (shallow ? shallowRef : ref)(initialValue);
  const rawInit = unref(initialValue);
  const type = guessSerializerType(rawInit);
  const serializer = options.serializer ?? StorageSerializers[type];
  const cookieOptions = getCookieOptions(cookieOpt);
  const { pause: pauseWatch, resume: resumeWatch } = pausableWatch(data, () => write(data.value), {
    flush,
    deep,
    eventFilter,
  });
  update();
  return data;

  function write(v) {
    try {
      if (v == null) {
        Cookie.remove(key, cookieOptions);
      } else {
        Cookie.set(key, serializer.write(v), cookieOptions);
      }
      if (listenToStorageChanges) {
        update();
      }
    } catch (e) {
      onError(e);
    }
  }

  function read(event) {
    if (event && event.key !== key) return;

    pauseWatch();
    try {
      const rawValue = event ? event.newValue : Cookie.get(key);

      if (rawValue == null) {
        if (writeDefaults && rawInit !== null) Cookie.set(key, serializer.write(rawInit), cookieOptions);
        return rawInit;
      } else if (typeof rawValue !== 'string') {
        return rawValue;
      } else {
        return serializer.read(rawValue);
      }
    } catch (e) {
      onError(e);
    } finally {
      resumeWatch();
    }
  }

  function update(event) {
    if (event && event.key !== key) return;

    data.value = read(event);
  }
};
