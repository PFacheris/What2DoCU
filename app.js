/*
* Requires and initialization.
*/
//Dependencies
var http = require('http'),
    express = require('express'),
    facebook = require('facebook-node-sdk');

var app = express();

var application_root = process.cwd();

/*
* Listening Port
*/
var port = process.env.PORT || 5000;
var server = http.createServer(app).listen(80);
app.listen(port, function () {
    console.log("Listening on " + port);
});

var io = require('socket.io').listen(server);

/*
* Application Logic
*/

// Config
app.configure(function () {
    app.set('title', 'What2DoCU');
    app.use(facebook.middleware({appId: '136332289871201', secret: '72ce5a8da6c8d89fec92d76b78fc620a'}));
    app.use(express.compress());
    app.use(app.router);
    app.use(express.static(application_root + "/public"));
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});


var events = io
.of('/events')
.on('connection', function (socket) {
    socket.emit('a message', {
        that: 'only'
        , '/chat': 'will get'
    });
    events.emit('a message', {
        everyone: 'in'
        , '/chat': 'will get'
    });
});

app.engine('jade', require('jade').__express);
app.set('view engine', 'jade');

app.get('/', facebook.loginRequired(), function (req, res) {
    res.render('index');
});
