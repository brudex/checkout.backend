const tenRandomAppIds= [ "7jTzXC15429767856C9A681Ml85kD0C5", "7jTzXC15429767856C9A681Ml85kD0C6", "7jTzXC15429767856C9A681Ml85kD0C7", "7jTzXC15429767856C9A681Ml85kD0C8", "7jTzXC15429767856C9A681Ml85kD0C9", "7jTzXC15429767856C9A681Ml85kD0C0", "7jTzXC15429767856C9A681Ml85kD0C1", "7jTzXC15429767856C9A681Ml85kD0C2", "7jTzXC15429767856C9A681Ml85kD0C3", "7jTzXC15429767856C9A681Ml85kD0C4" ];
const tenRandomUserIds= [ "7jTzXC15429767856C9A681Ml85kD0C5", "7jTzXC15429767856C9A681Ml85kD0C6", "7jTzXC15429767856C9A681Ml85kD0C7", "7jTzXC15429767856C9A681Ml85kD0C8", "7jTzXC15429767856C9A681Ml85kD0C9", "7jTzXC15429767856C9A681Ml85kD0C0", "7jTzXC15429767856C9A681Ml85kD0C1", "7jTzXC15429767856C9A681Ml85kD0C2", "7jTzXC15429767856C9A681Ml85kD0C3", "7jTzXC15429767856C9A681Ml85kD0C4" ];
const tenRandomTranxIds = [ "7jTzXC15429767856C9A681Ml85kD0C5", "7jTzXC15429767856C9A681Ml85kD0C6", "7jTzXC15429767856C9A681Ml85kD0C7", "7jTzXC15429767856C9A681Ml85kD0C8", "7jTzXC15429767856C9A681Ml85kD0C9", "7jTzXC15429767856C9A681Ml85kD0C0", "7jTzXC15429767856C9A681Ml85kD0C1", "7jTzXC15429767856C9A681Ml85kD0C2", "7jTzXC15429767856C9A681Ml85kD0C3", "7jTzXC15429767856C9A681Ml85kD0C4" ];

const paymentProviders  = [
    {
        providerId: "interpay",
        paymentMode: "MTN",
        isDefault:true
    },
    {
        providerId: "interpay",
        paymentMode: "VODAFONE",
        isDefault:true
    },
    {
        providerId: "interpay",
        paymentMode: "AIRTELTIGO",
        isDefault:true
    },
];

const apps =    [
        {
            "uuid": "123e4567-e89b-12d3-a456-426614174000",
            "userUuid": tenRandomUserIds[0],
            "paymentModes": ["card", "wallet"],
            "appName":"My First App",
            "logoUrl":"https://cachetechs.com/img/site_logo/logo_2.png",
            "appId": tenRandomAppIds[0],
            "apiKey": "apiKey456",
            "appSecret": "superSecretKey789",
            "alias": "My First App",
            "shouldSendClientCallback": true,
            "isActive": true
        },
        {
            "uuid": "223e4567-e89b-12d3-a456-426614174001",
            "userUuid": tenRandomUserIds[1],
            "paymentModes": ["crypto"],
            "appName":"My Second App",
            "logoUrl":"https://cachetechs.com/img/site_logo/logo_2.png",
            "appId": tenRandomAppIds[1],
            "apiKey": "apiKey654",
            "appSecret": "anotherSecretKey987",
            "alias": "Crypto Payment App",
            "shouldSendClientCallback": false,
            "isActive": true
        },
        {
            "uuid": "323e4567-e89b-12d3-a456-426614174002",
            "userUuid": tenRandomUserIds[2],
            "paymentModes": ["card", "wallet", "crypto"],
            "appName":"My Third App",
            "logoUrl":"https://cachetechs.com/img/site_logo/logo_2.png",
            "appId": tenRandomAppIds[2],
            "apiKey": "apiKey987",
            "appSecret": "yetAnotherSecretKey321",
            "alias": "Universal Payment App",
            "shouldSendClientCallback": true,
            "isActive": false
        }
    ];

const providerConfigs = [
    {
        appId:"7jTzXC15429767856C9A681Ml85kD0C5",
        providerId:"interpay",
        settingName:"interPayBaseUrl",
        settingValue:"",
        isDefault:true
    },
    {
        appId:"7jTzXC15429767856C9A681Ml85kD0C5",
        providerId:"interpay",
        settingName:"interPayAppId",
        settingValue:"",
        isDefault:true
    },
    {
        appId:"7jTzXC15429767856C9A681Ml85kD0C5",
        providerId:"interpay",
        settingName:"interPayAppKey",
        settingValue:"",
        isDefault:true
    },
];

const orderDetails = {
    "mobileNumber": "233246583910",
    "email": "info@kindheart.com",
    "payeeName": "233246583910",
    "orderDescription": "Paying for item"
}
//generate 10 sample payment transactions
const paymentTransactions = [{
    appId: tenRandomAppIds[0],
    userUuid: tenRandomUserIds[0],
    email: "test1@gmail.com",
    pageId: tenRandomTranxIds[0],
    amount: 100,
    currency: "GHS",
    paymentProvider: "interpay",
    paymentMode: "card",
    mobileNumber: "0244123456",
    mobileNetwork: "MTN",
    orderId: "ORD12345",
    transactionId: tenRandomTranxIds[0],
    providerReference: "PROV12345",
    paymentStatus: "PENDING",
    orderDescription: "Payment for goods",
    statusMessage: "Payment pending",
    transactionDetails: JSON.stringify(orderDetails),
    providerCallReceived: false,
    providerResponse: "",
    appCallBackUrl: "https://testapp.com/callback",
    appCallBackResponse: "",
    appCallBackSent: false,
    settlementStatus: "PENDING",
    paymentReference: "PROV12345",
    responseText: "",
    callbackRetries: 0,
    callbackResponseText: ""
},
    {
        appId: tenRandomAppIds[1],
        userUuid: tenRandomUserIds[1],
        email: "test1@gmail.com",
        pageId: tenRandomTranxIds[1],
        amount: 200,
        currency: "USD",
        paymentProvider: "interpay",
        paymentMode: "card",
        mobileNumber: "0244123456",
        mobileNetwork: "VODAFONE",
        orderId: "ORD12346",
        transactionId: tenRandomTranxIds[1],
        providerReference: "PROV12346",
        paymentStatus: "PENDING",
        orderDescription: "Payment for services",
        statusMessage: "Payment pending",
        transactionDetails: JSON.stringify(orderDetails),
        providerCallReceived: false,
        providerResponse: "",
        appCallBackUrl: "https://testapp.com/callback",
        appCallBackResponse: "",
        appCallBackSent: false,
        settlementStatus: "PENDING",
        paymentReference: "PROV12346",
        responseText: "",
        callbackRetries: 0,
        callbackResponseText: ""
    },
]


module.exports = {
    apps,
    providerConfigs,
    paymentProviders,
    paymentTransactions
};
