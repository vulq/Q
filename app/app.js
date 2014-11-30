var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session'); 
var hash = require('object-hash');

//Database
var mongo = require('mongoskin');
var db = mongo.db("mongodb://root:15122@proximus.modulusmongo.net:27017/aranut7I", {native_parser:true});

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
// Socket IO for broadcasting update
var server = require('http').Server(app);

server.listen(process.env.PORT);


// TODO: HUGE security risk
io = require('socket.io')(server);
io.sockets.on('connection', function(socket) {
    // Once heard from any client of update, broadcast to all clients
    socket.on('add', function (data) {
    // in our case, the information sent is not really important, the point is
    // to "wake up" all clients
        io.sockets.emit('add', data);
    });
    socket.on('delete', function (data) {
        io.sockets.emit('delete', data);
    });
    socket.on('refresh', function(data) {
        io.sockets.emit('refresh', data);
    })
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret: 'IloveQQQ122'}));
app.use(express.static(path.join(__dirname, 'public')));

// required for passport
//app.use(session({ secret: 'iloveQQQ' })); // session secret
//app.use(passport.initialize());
//app.use(passport.session()); // persistent login sessions

// Make our db accessible to our router
app.use(function(req, res, next) {
    req.db = db;
    next();
});
app.use('/', routes);
app.use('/users', users);

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
//on app restart, we reset help times


// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
