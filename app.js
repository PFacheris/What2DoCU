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
var server = http.createServer(app).listen(8888);
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
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'foo bar' }));
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
    socket.emit('new', {
        name: 'test',
        description: 'test2',
        location: 'will get',
        date: 'test3',
        picture: 'picture'
    });
});

app.engine('jade', require('jade').__express);
app.set('view engine', 'jade');

app.get('/', facebook.loginRequired(), function (req, res) {
    res.render('index');
});

var getEvents = function() {
    var query = "SELECT+eid+FROM+event_member+WHERE+uid+IN+(SELECT+uid+FROM+user+WHERE+uid+IN+(SELECT+uid1+FROM+friend+WHERE+uid2+=+me())+AND+'Columbia'+IN+affiliations)+AND+start_time+>=+1362210094+AND+start_time+<=+1362808800";
    req.facebook.api('/fql?q=' + query, function(err, events) {
        return something;     
    });
}
