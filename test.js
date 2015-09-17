//Allow because command line tool
/*eslint-disable no-console */
/*eslint-disable  no-process-exit*/

var cliArgs = require("command-line-args");
var _ = require("lodash");
var winston = require("winston");
winston.add(winston.transports.File, { level: "debug", filename: "riak.log"})
/* define the command-line options */
var cli = cliArgs([
    {name: "cluster", type: String, alias: "c", description: "servers list in form: 'host:port;host:port' "},
    {name: "help", type: Boolean, description: "Print usage instructions"},
    {name: "fail", type: Boolean, alias: "f", description: "Fail on first error"},
    {name: "num", type: Number, alias: "n", description: "Number of iterations"},
    {name: "threads", type: Number, alias: "t", description: "Concurrency"}
]);

/* parse the supplied command-line values */
var options = _.extend(  { num: 500000, threads: 20, cluster: "127.0.0.1:8087" }, cli.parse() );

/* generate a usage guide */
var usage = cli.getUsage({
    header: "A dump db application.",
    footer: ""
});

if (options.help || !options.cluster) {
    console.log(usage);
    process.exit(0);
}

var Promise = require("bluebird");
var ProgressBar = require('progress');
var Riak = require('basho-riak-client');
Promise.promisifyAll(Riak.Client.prototype);
var cluster = options.cluster.split(";");
var client = new Riak.Client(cluster);


var stat = {
    count: 0,
    sum: 0,
    avg: 0.0,
    failed:0,
    maxTime:0,
    minTime:99999,
    slowCount: 0
}


exports.search = function (bucket, q, options) {
    options = options || {};
    var startDate = new Date();
    var startTime = startDate.getTime();
    return client.searchAsync({indexName: bucket, q: q, maxRows: options.rows})
        .then(function (response) {
            var eventTime = new Date();
            var stats = {queryTime: eventTime - startTime}

            stat.count ++;
            stat.sum += stats.queryTime
            stat.avg = stat.sum / stat.count;
            stat.minTime= Math.min(stat.minTime, stats.queryTime )
            stat.maxTime= Math.max(stat.maxTime, stats.queryTime )

            if (stats.queryTime > 400) {
                console.log( "\n", startDate, "              ", new Date(), "Slow query", stats.queryTime)
                stat.slowCount ++
            }
            return {
                items: response.docs,
                count: response.numFound
            };
        })

}


var testCases = _.range(options.num);


var bar = new ProgressBar(' [:bar] :percent :etas    :current of :total', {
    total: testCases.length, complete: '=',
    incomplete: ' ',
    width: 40
});


/**/

Promise.map(testCases, (x) => {
    return exports.search( "index2", "*:*", {rows: 0})
        .catch(function (e) {
            stat.failed ++;
        })
        .finally(()=> {
            bar.tick();

        })


}, {concurrency: options.threads})
    .then(function () {
        console.log("Done,  total: %s failed: %s, slow: %s, \n Times:   min %s,  max  %s,   avg: %s ", stat.count, stat.failed, stat.slowCount,  stat.minTime,  stat.maxTime, stat.avg )
        process.exit(0);
    })

