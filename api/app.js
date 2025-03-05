var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const flightRoutes = require('./routes/flightRoutes');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api', flightRoutes);

app.listen(3000, () => {
    console.log('Node.js API 3000 portunda çalışıyor');
});


module.exports = app;
