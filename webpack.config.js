const path = require('path');

module.exports = {
  entry: __dirname + '/static/app.js',
  mode: "development",
  devtool: 'source-map',
  output: {
      path: path.resolve(__dirname, 'static/dist')
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(\/node_modules\/core-js|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react']
          }
        }
      }
    ]
  }
};
