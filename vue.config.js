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
    config.devtool('cheap-module-source-map');
    config.module
      .rule('i18n')
      .resourceQuery(/blockType=i18n/)
      .type('javascript/auto')
      .use('i18n')
      .loader('@intlify/vue-i18n-loader');
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
