const express = require("express");
const cors = require('cors');
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const expressLayouts = require('express-ejs-layouts');

const indexRouter = require("./routes/index");
const app = express();

app.use(logger("dev"));
app.set("views", path.join(__dirname, "./views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set('layout', 'layout/layout'); // Set the default layout

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '/public')));
app.use(cookieParser());

// Redirect root to transaction page
app.get('/', (req, res) => {
    res.redirect('/trxn/7jTzXC15429767856C9A681Ml85kD0C5');
});

app.use("/", indexRouter);
app.get("/*", (req, res) => res.sendFile(path.resolve(__dirname + '/public/index.html')));

app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if(app.get('env') === 'development') {
    app.use((err, req, res, next) => {
        console.log(err);
        res.status(err.status || 500);
        res.send(err.message);
    });
}

app.use((err, req, res, next) => {
    console.log(err);
    res.status(err.status || 500);
    res.send(err.message);
});

module.exports = app;