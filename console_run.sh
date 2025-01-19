#!/usr/bin/env bash
pm2 stop ecosystem.config.js
npm install
export PORT=3666
export NODE_ENV=production
npm start

