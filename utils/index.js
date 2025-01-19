const crypto = require('crypto');
const dateFns = require('date-fns');

function generateSessionId(){
    return generateTransId();
}

function getCurrentDateTime(){
  return new Date();
}

function formatDate(date){
    let mm = date.getMonth() + 1;
    mm= mm>9 ? '' + mm :'0'+ mm;
    let dd = date.getDate();
    dd= dd > 9 ? '' + dd :'0'+ dd;
    return [date.getFullYear(),   mm, dd].join('-');
}


function getNextDayDate(isoDate) {
    try {
        var date = dateFns.parseISO(isoDate);
        var nextDay = dateFns.addDays(date, 1);
        return dateFns.format(nextDay, 'Y-MM-dd');
    }catch (e) {
        console.log('There is an error getNextDayDate value passed>>'+isoDate);
        return dateFns.format(new Date(), 'Y-MM-dd');
    }
}

function getPreviousDay(isoDate) {
    try {
        var date = dateFns.parseISO(isoDate);
        var nextDay = dateFns.addDays(date, -1);
        return dateFns.format(nextDay, 'Y-MM-dd');
    }catch (e) {
        console.log('There is an error getNextDayDate value passed>>'+isoDate);
        return dateFns.format(new Date(), 'Y-MM-dd');
    }
}

//2110158
function timeStamp(dayOnly){
    var date = new Date();
    var mm =  (date.getMonth() + 1) >= 10? ''+(date.getMonth() + 1):'0'+(date.getMonth() + 1);
    var dd = date.getDate();
    if(dayOnly){
        return [date.getFullYear(), mm, dd].join('');
    }
    var hh =  date.getHours() > 10? ''+date.getHours():''+date.getHours();
    var min = date.getMinutes() > 10? ''+date.getMinutes():''+date.getMinutes();
    var ss = date.getSeconds() > 10? ''+date.getSeconds():''+date.getSeconds();
    return [date.getFullYear(), mm, dd, hh, min, ss].join('');
}

function toTimeStamp(date,dayOnly){
    var mm =  (date.getMonth() + 1) >= 10? ''+(date.getMonth() + 1):'0'+(date.getMonth() + 1);
    var dd = date.getDate();
    if(dayOnly){
        return [date.getFullYear(), mm, dd].join('');
    }
    var hh =  date.getHours() > 10? ''+date.getHours():''+date.getHours();
    var min = date.getMinutes() > 10? ''+date.getMinutes():''+date.getMinutes();
    var ss = date.getSeconds() > 10? ''+date.getSeconds():''+date.getSeconds();
    return [date.getFullYear(), mm, dd, hh, min, ss].join('');
}



function generateTransId(){
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + s4() + s4() +
        s4() + s4() + s4() + s4();
}

function getRandomReference(){
    var date = new Date();
    var components = [
        date.getYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
    ];
    return components.join("")  +randomInt(5);
}

function removeInvalidIUssdCharacters(text){
    let resultText='';
    resultText =  text.replace(/\%/g,'');
    resultText =  resultText.replace(/&/g,' and ');
    resultText =  resultText.replace(/'/g,'');
    resultText =  resultText.replace(/\//g,' ');
    resultText =  resultText.replace(/\$/g,'');
    return resultText;
}

function getDayOfWeek(){
    var d = new Date();
    var n = d.getDay();
    return n;
}

function randomInt(string_length) {
	var chars = "0123456789";
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function getSha1(text){
    const  shasum = crypto.createHash('sha1');
    shasum.update(text);
    return shasum.digest('hex');
}

function extractSelectedOptionText(response,input){
    console.log("extractSelectedOptionText >>"+input);
    let text =response;
    let retVal = null;
    const pattern = `(\n|$)(${input})\\s(.+)(\\n|\\r|$)`;
    const reOptions = new RegExp(pattern);
    const matchObj = reOptions.exec(text);
    if(matchObj){
        retVal = matchObj[3];
    }
    return retVal;
}

function formatMobile(mobile){
    if(mobile!= null){
        mobile= mobile.trim();
        if(mobile.indexOf("233") === 0) {
            return mobile;
        } else  {
            if(mobile.indexOf("0") === 0) {
                mobile = "233"+mobile.substr(1);
            } else if(mobile.indexOf("+") === 0) {
                mobile = mobile.substring(1);
            }else{
                return "233"+mobile;
            }
            return mobile;
        }
    }
    return "";
}



function generateCollectionCode(index){
   let prefix = ( ""+ new Date().getUTCFullYear()).substring(2);
   let len= 7;
   let padlen=len-prefix.length;
   return prefix+ (""+index).padStart(padlen,"0");
}

function generateReceiptNumber(index){
    let prefix = "1";
    let len= 7;
    let padlen=len-prefix.length;
    return prefix+ (""+index).padStart(padlen,"0");
}


function extractNetworkName(network){
    if(network.toLowerCase().indexOf('mtn')>-1){
        return 'MTN';
    }
    if(network.toLowerCase().indexOf('voda')>-1){
        return 'VODAFONE';
    }
    if(network.toLowerCase().indexOf('airtel')>-1 || network.toLowerCase().indexOf('tigo') ){
        return 'AIRTEL';
    }
    return network;
}


function extractAmountFromString(amountString){
    let matches = amountString.match(/GHS.*(\d+)/);
    if(matches && matches.length){
        return matches[0].match(/(\d+)/)[0];
     }
    return '0';
}


function camelCaseToSentence(text){
    const result = text.replace(/([A-Z])/g, " $1");
    const finalResult = result.charAt(0).toUpperCase() + result.slice(1);
    return finalResult;
}

module.exports = {
    getNewSessionId: generateSessionId,
    camelCaseToSentence,
    getCurrentDateTime: getCurrentDateTime,
    generateTransId: generateTransId,
    isNumeric : isNumeric,
    getSha1 : getSha1,
    getRandomReference :getRandomReference,
    timeStamp:timeStamp,
    getDayOfWeek:getDayOfWeek,
    toTimeStamp,
    extractNetworkName,
    extractAmountFromString,
    formatMobile,
    randomInt,
    removeInvalidIUssdCharacters,
    generateCollectionCode,
    generateReceiptNumber,
    formatDate,
    getNextDayDate,
    getPreviousDay,
    extractSelectedOptionText:extractSelectedOptionText
};