var results; //returned from FQL search

results = 
{
  "data": [
    {
      "eid": 322117051232546
    }, 
    {
      "eid": 338587526243241
    }, 
    {
      "eid": 164859380330485
    }, 
    {
      "eid": 338587526243241
    }
  ]
};


var ids = [], results = results.data;

//console.log(results);

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


console.log(combined);

combined //sorted array in form [ {id: <id1>, number: <number1>}, {id: <id2>, number: <number2>},...]

/*
// counts repetitions
//initialize count array
var count = [];
for (var i = 0; i < ids.length; i++){
    count[i]=0;
}

//count duplicates
for (var i = 0; i < ids.length; i++) {
    for (var j = 0; ids.length; j++) {
        if (ids[i].eid == ids[j].eid){
            count[i]++;
        }
    }
}*/
