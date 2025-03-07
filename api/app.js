var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const demandRouter = require('./routes/demandRoutes');
const revenueRouter = require('./routes/revenueRoutes');
const satisfactionRouter = require('./routes/satisfactionRoutes');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/demand', demandRouter);
app.use('/revenue', revenueRouter);
app.use('/satisfaction', satisfactionRouter);


app.listen(3000, () => {
    console.log('Node.js API 3000 portunda çalışıyor');
});


module.exports = app;
