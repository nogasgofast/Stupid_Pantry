const path = require('path');

module.exports = {
  entry: './static/app.js',
  mode: "development",
  output: {
      path: path.resolve(__dirname, 'static/dist')
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
