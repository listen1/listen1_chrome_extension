const Store = require('electron-store');
const schema = {
  theme: { type: 'string', default: 'black' },
  windowState: {
    type: 'object',
    default: {
      width: 1000,
      height: 670,
      maximized: false,
      zoomLevel: 0
    }
  },
  floatingWindowBounds: {
    type: 'object',
    default: {
      width: 1000,
      height: 100
    }
  }
};
const isObject = (value) => {
  return typeof value === 'object' && !Array.isArray(value) && value !== null;
};
const store = new Store({ schema });
const safeGet = (key) => {
  // TODO: recursive check default value
  const result = store.get(key);
  if (isObject(result)) {
    return { ...schema[key]['default'], ...result };
  }
};
module.exports = {
  get: store.get,
  set: store.set,
  safeGet
};
