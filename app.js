var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongo = require('mongodb');
var mongoose = require('mongoose');

if(process.env.DB_URL != undefined)
{
    mongoose.connect(process.env.DB_URL);
}
else
{
    // Fallback when running project locally
    mongoose.connect('mongodb://localhost/achievementsapi');
}



var routes = require('./controllers/index');
var games = require('./controllers/games');
var users = require('./controllers/users');
var tasks = require('./controllers/tasks');


// Note to self:
// Game logos can be found at http://cdn.akamai.steamstatic.com/steam/apps/{appid}}/header.jpg


console.log('lets go');


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
  console.log('db setup done');
});




var app = express();
app.listen(process.env.PORT || 5000);

app.use('/', routes);
app.use('/games', games);
app.use('/users', users);
app.use('/tasks', tasks);


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Do I need all these?
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render(err, {
    message: err.message,
    error: {}
  });
});


module.exports = app;
