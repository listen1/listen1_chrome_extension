/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
module.exports = {
  pages: {
    index: {
      template: 'public/index.html',
      entry: './src/main.js',
      title: 'Listen 1'
    }
  },
  chainWebpack: (config) => {
    config.externals({
      ...config.get('externals'),
      forge: 'forge',
      electron: 'electron'
    });
  },
  pluginOptions: {
    browserExtension: {
      componentOptions: {
        background: {
          entry: 'src/background.js'
        }
      }
    }
  }
};
