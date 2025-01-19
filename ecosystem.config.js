module.exports = {
    apps : [{
      name: "CachePay-Checkout",
      script: "./bin/www",
      env: {
        NODE_ENV: "production",
        PORT: 3666,
      }
    },
    {
        name: "CachePay-Checkout-Cron",
        script: "./cronserver.js",
        env: {
            NODE_ENV: "production",
        }
    }]
};