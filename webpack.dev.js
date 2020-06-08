const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  output: {
    publicPath: "/"
  },
  devServer: {
    contentBase: 'pyloot/static',
    proxy: {
        '/api': {
            target: 'http://localhost:8000',
            secure: false
        }
    }
  },
});