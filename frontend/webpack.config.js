const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (_env, argv = {}) => {
  const isProduction = argv.mode === 'production';
  const generateSourceMap = process.env.GENERATE_SOURCEMAP === 'true';

  return {
    mode: argv.mode || 'development',
    entry: './src/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].bundle.js',
      chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
      publicPath: '/',
      clean: true
    },
    resolve: { extensions: ['.ts', '.tsx', '.js', '.jsx'] },
    module: {
      rules: [
        { test: /\.m?js$/, resolve: { fullySpecified: false } },
        { test: /\.(ts|tsx)$/, exclude: /node_modules/, use: { loader: 'ts-loader', options: { transpileOnly: true } } },
        { test: /\.(js|jsx)$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: { cacheDirectory: true, presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'] } } },
        { test: /\.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] },
        { test: /\.(png|jpg|jpeg|gif|svg)$/i, type: 'asset/resource' }
      ]
    },
    plugins: [new HtmlWebpackPlugin({ template: path.resolve(__dirname, 'public/index.html') })],
    // Production source maps add substantial CPU, memory and output volume. Enable only for an explicit release-debug build.
    devtool: isProduction ? (generateSourceMap ? 'source-map' : false) : 'eval-cheap-module-source-map',
    cache: { type: 'filesystem', cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack') },
    parallelism: 2,
    devServer: {
      static: { directory: path.join(__dirname, 'public') },
      port: process.env.PORT || 3001,
      open: true,
      hot: true,
      compress: true,
      historyApiFallback: true,
      proxy: [{ context: ['/api'], target: 'http://127.0.0.1:5000', secure: false, changeOrigin: true, logLevel: 'debug' }],
      client: { overlay: { errors: true, warnings: false } }
    },
    optimization: {
      // Use webpack's bundled production minimizer; no untracked plugin dependency is required.
      minimize: isProduction,
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxInitialRequests: 20,
        cacheGroups: {
          framework: { test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/, name: 'framework', chunks: 'all', priority: 30 },
          three: { test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/, name: 'three', chunks: 'all', priority: 25 },
          vendors: { test: /[\\/]node_modules[\\/]/, name: 'vendors', chunks: 'all', priority: 10 }
        }
      }
    },
    performance: { hints: isProduction ? 'warning' : false },
    stats: isProduction ? 'errors-warnings' : 'normal'
  };
};
