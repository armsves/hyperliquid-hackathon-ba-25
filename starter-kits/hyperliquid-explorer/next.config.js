/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Ignore optional dependencies that aren't needed for web
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false,
    };
    
    // Ignore React Native and optional dependencies
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@react-native-async-storage\/async-storage$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^pino-pretty$/,
      })
    );
    
    return config;
  },
}

module.exports = nextConfig

