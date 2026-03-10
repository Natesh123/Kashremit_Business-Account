const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const path = require('path');

config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    crypto: path.resolve(__dirname, 'empty-module.js'),
    stream: path.resolve(__dirname, 'empty-module.js'),
    http: path.resolve(__dirname, 'empty-module.js'),
    https: path.resolve(__dirname, 'empty-module.js'),
    url: path.resolve(__dirname, 'empty-module.js'),
    zlib: path.resolve(__dirname, 'empty-module.js'),
    path: path.resolve(__dirname, 'empty-module.js'),
    fs: path.resolve(__dirname, 'empty-module.js'),
    buffer: path.resolve(__dirname, 'empty-module.js'), // Note: buffer might actually be needed, but let's start with this.
};

// If standard Node modules are used by a dependency (like axios 1.7+), 
// we can also use a "null" placeholder if we don't want to install polyfills.
// But usually for axios, we want to make sure it doesn't try to use node-specific logic.

module.exports = config;
