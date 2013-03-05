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
var port = process.env.PORT || 5000,
    server = http.createServer(app).listen(port, function () {
        console.log("Listening on port: " + port);
    }),
    io = require('socket.io').listen(server, { log: false });


/*
* Application Logic
*/

var appId ='136332289871201';
var appSecret = '72ce5a8da6c8d89fec92d76b78fc620a';

// Config
app.configure(function () {
    app.set('title', 'What2DoCU');
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'what2docu' }));
    app.use(express.static(application_root + "/public"));
    app.use(express.compress());
    app.use(app.router);
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});

io.configure(function () { 
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10); 
});


var events = io.of('/events')
.on('connection', function (socket) {
    socket.on('set token', function (data) {
        if (data.hasOwnProperty('token'))
        {
            var fb = new facebook({appId: appId, secret: appSecret});
            fb.setAccessToken(data.token);
            getEvents(fb, function(combined) {
                makeQuery(fb, socket, combined, 0, function () {
                    var URL =" http://data.adicu.com/affairs/student_events?pretty=false&api_token=51314d8e97ec7700025e0afd";
                    var get_req = http.get(URL, function(response) {
                        var body = "";
                        response.on('data', function (chunk) {
                            body += chunk;
                        });
                        response.on('end', function() { 
                            var response = JSON.parse(body).data;
                            var toSendADI = [];


                            for (var i = 0; i < 12; i ++) {
                                toSendADI.push({name: response[i].Event, start_time: response[i].Date + ", " + response[i].Time, location: response[i].Location});
                            }

                            makeQuery2(socket, toSendADI, 0);
                        })
                        response.on('error', function(err) {
                            console.log("error"); 
                        });

                    });
                });
            });
        }
    });
});

var social = io.of('/social')
.on('connection', function (socket) {
    socket.on('click', function (data) {
        socket.broadcast.emit('interest', data);
    });
});

app.engine('jade', require('jade').__express);
app.set('view engine', 'jade');

var isLoggedIn = function(req, res, next)
{
    var fbTemp = new facebook({appId: appId, secret: appSecret, request: req});
    fbTemp.getUser(function (err, user) {
        if (err) {
            next(err);
            next = null;
        }
        else {
            if (user === 0) { 
                try {
                    var params = [];
                    params["scope"] = "friends_events,friends_education_history,user_events,user_education_history";
                    params["display"] = "popup";

                    var url = fbTemp.getLoginUrl(params);
                }
                catch (err) {
                    next(err);
                    next = null;
                    return;
                }
                res.redirect(url);
                next = null;
            }
            else {
                next();
                next = null;
            }
        }
    });
}

app.get('/', function (req, res) {
    res.render('index');
});

app.get('/home', isLoggedIn, function (req, res) {
    var fbTemp = new facebook({appId: appId, secret: appSecret, request: req});
    
    fbTemp.api('/me?fields=id,name,link,picture,education', function(err, user) {
        fbTemp.getAccessToken(function(err, token){
            res.render('home', {locals: user, token: token});
        });
    });
});




//returns sorted array in form [ {id: <id1>, number: <number1>}, {id: <id2>, number: <number2>},...]
var getEvents = function(fb, res) {
    var start_time = Math.round(new Date().getTime() / 1000);
    var end_time = start_time + 604800;
    var query = "SELECT+eid+FROM+event_member+WHERE+uid+IN+(SELECT+uid+FROM+user+WHERE+uid+IN+(SELECT+uid1+FROM+friend+WHERE+uid2=me())+AND+'Columbia'+IN+affiliations)+AND+start_time>=" + start_time + "+AND+start_time<=" + end_time + "+AND+rsvp_status='attending'";
    fb.api('/fql?q=' + query , function(err, results) {
        if(err)
        {
            console.log(err);
            return;
        }  
        var ids = [], results = results.data;


        // reformats array of ids
        for (var i = 0; i < results.length; i++){
            var datum = results[i];
            ids.push(datum.eid);
        }

        //create list of unique ids
        var uniqueID = [];
        var add = true
        for (var i = 0; i < ids.length; i++) {

            add = true;

            for (var j =0; j < uniqueID.length; j++) { //(!uniqueID.contains(ids[i]) {

                if (ids[i] == uniqueID[j]) {
                    add = false
                }
            }
            if (add) {
                uniqueID.push(ids[i]);
            }
        }

        //initialize count array
        var count = [];
        for (var i = 0; i < uniqueID.length; i++){
            count[i]=0;
        }

        //count duplicates
        for (var i = 0; i < ids.length; i++){
            for (var j = 0; j <uniqueID.length; j++) {
                if (ids[i] == uniqueID[j]) {
                    count[j]++;
                }
            }
        }

        //combine and sort
        var combined = [];
        for (var i = 0; i < uniqueID.length; i++) {
            combined.push({id: uniqueID[i], number: count[i]});
        }

        //sort based on count
        combined.sort(function(a,b) {
            return b.number - a.number;
        });

        res(combined);
    });
}

var makeQuery = function(fb, socket, combined, i, callback) {
    if (i < 32)
    {
        var query = combined[i].id + "?fields=name,start_time,end_time,location,picture";
        fb.api('/' + query, function(err, results){
            if (err)
                console.log("error");
            else
            {
                socket.emit('new', results);
                makeQuery(fb, socket, combined, i + 1, callback);
            }
        });
    }
    else
        callback();
}

var makeQuery2 = function(socket, combined, i) {
    if (i<12) {
        socket.emit('new', combined[i]);
        makeQuery2(socket, combined, i+1);
    }
}
