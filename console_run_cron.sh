#!/usr/bin/env bash
pm2 stop ecosystem.config.js
npm install
export NODE_ENV=production
node cronserver.js

