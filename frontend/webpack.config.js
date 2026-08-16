// frontend/webpack.config.js (نسخه اصلاح شده نهایی با رفع تداخل نام فایل)
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: argv.mode || 'development',
    entry: './src/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      // +++ استفاده از [name] برای نام‌گذاری تکه‌ها +++
      filename: isProduction ? '[name].[contenthash].js' : '[name].bundle.js',
      // ++++++++++++++++++++++++++++++++++++++++++++++
      publicPath: '/',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
      rules: [ { test: /\.m?js/, resolve: { fullySpecified: false } }, { test: /\.m?js/, resolve: { fullySpecified: false } }, { test: /\.m?js/, resolve: { fullySpecified: false } },
        { test: /\.(ts|tsx)$/, exclude: /node_modules/, use: { loader: 'ts-loader', options: { transpileOnly: true } } },
        { test: /\.(js|jsx)$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: { presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'] } } },
        { test: /\.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] },
        { test: /\.(png|jpg|jpeg|gif|svg)$/i, type: 'asset/resource' },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public/index.html'),
      }),
    ],
    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      port: process.env.PORT || 3001,
      open: true,
      hot: true,
      compress: true,
      historyApiFallback: true,
      proxy: [
        {
          context: ['/api'],
          target: 'http://127.0.0.1:5000',
          secure: false,
          changeOrigin: true,
          logLevel: 'debug',
        }
      ],
      client: {
        overlay: { errors: true, warnings: false },
      },
    },
    // +++ تنظیمات بهینه‌سازی که باعث ایجاد تکه‌ها می‌شود +++
    optimization: {
      splitChunks: {
        chunks: 'all', // تقسیم کد برای همه انواع ماژول‌ها
        // می‌توانید تنظیمات بیشتری برای کنترل نحوه تقسیم اضافه کنید
        // cacheGroups: { ... }
      },
    },
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++
    performance: {
      hints: isProduction ? 'warning' : false
    },
  };
};
