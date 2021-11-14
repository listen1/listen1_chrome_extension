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
  }
};

const store = new Store({ schema });
module.exports = store;
