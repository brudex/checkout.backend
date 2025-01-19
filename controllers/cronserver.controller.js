"use strict";
const cron = require('node-cron');
const paymentsController = require('./payment.controller');
const callbackController = require('./callback.controller');

callbackController.processUnsentCallbacks();

paymentsController.processPendingTransactions();
cron.schedule('*/1 * * * *', () => {
    console.log('Running processPendingTransactions>>');
    paymentsController.processPendingTransactions();
});

// cron to process unsent callbacks every 2 minutes
cron.schedule('*/2 * * * *', () => {
    console.log('Running processUnsentCallbacks>>');
    callbackController.processUnsentCallbacks();
});




