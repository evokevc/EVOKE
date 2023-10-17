const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  target: 'web',
  entry: './index.js', // Update with your entry file
  output: {
    filename: 'bundle.js', // Update with your desired output file
    path: path.resolve(__dirname, 'dist'), // Update with your desired output directory
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'node_modules/@iota/identity-wasm/web/identity_wasm_bg.wasm',
          to: 'identity_wasm_bg.wasm'
        }
      ]
    }),
  ],
  mode: 'development', // or 'production',
  module: {
    rules: [
      // Add any necessary rules for handling different file types or modules
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader', // You may need to configure Babel to transpile your code
      },
    ],
  },
  resolve: {
    fallback: {
      path: require.resolve('path-browserify'),
      fs: false,
      stream: require.resolve('stream-browserify'),
      },
    extensions: ['.js'], // Add any other file extensions you want to support
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'), // Update with your desired development server directory
    port: 8080, // Update with your desired development server port
  },
};
