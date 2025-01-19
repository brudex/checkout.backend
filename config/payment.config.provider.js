const db = require('../models');
const Provider  = {};
Provider.getConfigByAppId = async function (appId,providerId) {
    let settings=[];
    if(appId){
       settings  = await db.PaymentProviderConfig.findAll({where : {appId:appId,providerId:providerId}});
    }
   if(settings.length === 0){
       settings = await db.PaymentProviderConfig.findAll({where : {isDefault:true,providerId:providerId}})
   }
   const config = {};
   settings.forEach(function (item) {
       config[item.settingName.trim()]=item.settingValue.trim();
   });
   return config;
};

module.exports = Provider;
