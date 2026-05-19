// Limit parallel transform workers to reduce peak RAM on Windows (avoids VirtualAlloc / OOM during bundling).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.maxWorkers = 2;
module.exports = config;
