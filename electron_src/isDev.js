const isDev = process.defaultApp || /node_modules[\\/]electron[\\/]/.test(process.execPath);

module.exports = isDev;
