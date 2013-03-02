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


var events = io.of('/events');
var social = io.of('/social')
.on('click', function (socket) {
    socket.get("event", function(err, event) {
        social.broadcast('interest', {"event": {"name": event.name, "link": event.link}});
    });
});

app.engine('jade', require('jade').__express);
app.set('view engine', 'jade');

app.get('/', facebook.loginRequired(), function (req, res) {
    req.facebook.api('/me?fields=id,name,link,picture,education', function(err, user) {
        res.render('index', {locals: user});
    });
    getEvents(req, function(combined) {
        makeQuery(req, combined, 0);
        
        URL =" http://data.adicu.com/affairs/student_events?pretty=true&api_token=51314d8e97ec7700025e0afd";
        
        var get_req = http.get(URL, function(response) {
        var body = "";
        response.on('data', function (chunk) {
            body += chunk;
        });
        response.on('end', function() { 
console.log(body);
console.log(body.status_code);
console.log(body["data"]);
body = body.data; var toSendADI = [];
console.log(body);


for (var i = 0; i < 10; i ++) {
    toSendADI.push({name: body[i].Event, start_time: body[i].Date + ", " + body[i].Time, location: body[i].Location});
}

console.log(toSendADI);

     makeQuery2(req, toSendADI, 0);
        })
        response.on('error', function(err) {
            callback({"msg": "Error sending data."}); 
        });

    });
    });
});


//returns sorted array in form [ {id: <id1>, number: <number1>}, {id: <id2>, number: <number2>},...]
var getEvents = function(req, res) {
    var query = "SELECT+eid+FROM+event_member+WHERE+uid+IN+(SELECT+uid+FROM+user+WHERE+uid+IN+(SELECT+uid1+FROM+friend+WHERE+uid2=me())+AND+'Columbia'+IN+affiliations)+AND+start_time>=1362210094+AND+start_time<=1362808800";
    req.facebook.api('/fql?q=' + query, function(err, results) {
        if(err)
            return;
            
       // console.log(results);
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

var makeQuery = function(req, combined, i) {
    if (i < 32)
    {
        var query = combined[i].id + "?fields=name,start_time,end_time,location,picture";
        req.facebook.api('/' + query, function(err, results){
            if (err)
                console.log("error");
            else
            {
                events.emit('new', results);
                makeQuery(req, combined, i + 1);
            }
        });
    }
}

var makeQuery2 = function(req, combined, i) {
    if (i<12) {
        events.emit('new', combined[i]);
        makeQuery(req, combined, i+1);
    }
}
