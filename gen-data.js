//Allow because command line tool
/*eslint-disable no-console */
/*eslint-disable  no-process-exit*/

var cliArgs = require("command-line-args");
var _ = require("lodash");
/* define the command-line options */
var cli = cliArgs([
    {name: "cluster", type: String, alias: "c", description: "servers list in form: 'host:port;host:port' "},
    {name: "help", type: Boolean, description: "Print usage instructions"},
    {name: "num", type: Number, alias: "n", description: "Number Of items"},
    {name: "threads", type: Number, alias: "t", description: "Concurrency"},

]);

/* parse the supplied command-line values */
var options = _.extend(  { num: 10000, threads:20, cluster: "127.0.0.1:8087" }, cli.parse() );

/* generate a usage guide */
var usage = cli.getUsage({
    header: "A dump db application.",
    footer: ""
});

if (options.help || !options.cluster ) {
    console.log(usage);
    process.exit(0);
}



var Promise = require("bluebird");
var uuid = require("uuid");
var ProgressBar = require('progress');
var Riak = require('basho-riak-client');
Promise.promisifyAll(Riak.Client.prototype);
var cluster = options.cluster.split(";");
var client = new Riak.Client(cluster);

function fillMapOperationsFromObject(mapOp, object) {
    _.each(object, function (value, key) {
        if (_.isNumber(value)) {
            mapOp.incrementCounter(key, value)
        }
        else if (_.isBoolean(value)) {
            mapOp.setFlag(key, value)
        }
        else if (Array.isArray(value)) {
            //handle Set
            _.each(value, function (setValue) {
                mapOp.addToSet(key, setValue)
            });
        }
        else if (_.isObject(value)) {
            var innerMap = mapOp.map(key);
            fillMapOperationsFromObject(innerMap, value);
        }
        else {
            if (value)
                mapOp.setRegister(key, value.toString())

        }
    })
}

var testCases = _.range( options.num );


var bar = new ProgressBar(' [:bar] :percent :etas    :current of :total', {
    total: testCases.length, complete: '=',
    incomplete: ' ',
    width: 40
});

var stat = {
    processed: 0,
    failed:0
}

function getRandomInt( max) {
    var min = 0;
    return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomBool( ) {
    return Math.round( Math.random()  ) == 1;
}

var fullString = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
function randomString(){
    return fullString.substring(0, getRandomInt(fullString.length-1) )
}


function generateItem(maxDeep, maxRegisters, maxCounters, maxFlags, level ){
    if ( level == undefined )
        level = maxDeep;

    var object = {};
    var numOfRegisters = getRandomInt(maxRegisters);
    var numOfCounters =getRandomInt(maxCounters);
    var numOfFlags = getRandomInt(maxFlags);
    var numOfItemsInMap = getRandomInt(100);
    var numOfItemsInSet = getRandomInt(20);
    for(  var i=0; i< numOfRegisters; i++ )
    {
        object["register" + i] = randomString();
    }

    for(  var i=0; i< numOfFlags; i++ )
    {
        object["flag" + i] = getRandomBool();
    }

    for(  var i=0; i< numOfCounters; i++ )
    {
        object["counter" + i] = (getRandomBool()? 1:-1)* getRandomInt(10000);
    }
    if ( level > 0) {
        object.subMapObject = {}
        for(  var i=0; i< numOfItemsInMap; i++ )
        {
            object.subMapObject[ uuid.v4().split("-").join("")] = generateItem (maxDeep,5,3,3, level-1)
        }
    }

    object.subMapArray = [ ];

    for(  var i=0; i< numOfItemsInSet; i++ )
    {
        object.subMapArray.push( randomString() );
    }


    return object;

}




Promise.map( testCases, (x) => {
    var mapOp = new Riak.Commands.CRDT.UpdateMap.MapOperation();
    var item  = { value: generateItem (1,10,5,5), key: uuid.v4().split("-").join("") };

    fillMapOperationsFromObject(mapOp, item.value)
    return client.updateMapAsync({bucket: "fill", key: item.key, bucketType: "maps", op: mapOp})
        .then( () => {
            stat.processed ++;
        }).catch((e) =>{
            stat.failed ++;
        })
        .finally(()=> {
            bar.tick();
        })

}, {concurrency: options.threads })
    .then(function () {
        console.log("Done,  total: %s failed: %s", stat.processed, stat.failed )
        process.exit(0);
    });



