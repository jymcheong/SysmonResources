const directory_to_monitor = "C:/Windows/Datafusion/logs";
// Start ODB stuff -----------------------
var ODB_User = 'root'
var ODB_pass = 'Password1234'
var OrientDB = require('orientjs');
var server = OrientDB({host: 'myorientdb', port: 2424});
var db = server.use({name: 'DataFusion', username: ODB_User, password: ODB_pass, useToken : true});
// End ODB stuff -------------------------
// Use npm local install XXX instead of global, especially in Windoze!
var fs = require('fs'), es = require('event-stream'); //install first: npm i event-stream
var lineCount = 0
var rowCount = 0
var reconnectCount = 0

startFileMonitor() // starts directory monitoring for rotated logs
//processFile('/tmp/events.txt') // test single file

// tried ODB scheduler but it throws error due to "return"s within the scripts.
// A security hazard if client script runs in untrusted environment + server-side javascipt is enabled
setInterval(function(){ reconnectCount++; db.query('select ConnectImageLoad()')}, 5000);
setInterval(function(){ db.query('select ConnectProcessAccess()')}, 5000);

//https://stackoverflow.com/questions/16010915/parsing-huge-logfiles-in-node-js-read-in-line-by-line
function processFile(filepath) {
    var s = fs.createReadStream(filepath)
        .pipe(es.split())
        .pipe(es.mapSync(function(line) {            
            // pause the readstream
            s.pause();
            // process line here and call s.resume() when rdy
            processLine(line)
            lineCount++
            // resume the readstream, possibly from a callback
            s.resume();
        })
        .on('error', function(err){
            console.log('Error while reading file.', err);
        })
        .on('end', function(){
            console.log('Read entire file.')
            console.log('Total line count: ' + lineCount) // tally with row count
            console.log('Total row count:' + rowCount)
            //either zip & delete the file.. after a while it's huge.
            fs.unlink(filepath, (err) => {
                if (err) console.log(filepath + ' delete error');
                console.log(filepath + ' was deleted');
              });
            if(reconnectCount > 12){
                reconnectCount = 0
                db.close()
                db = server.use({name: 'DataFusion', username: ODB_User, password: ODB_pass, useToken : true});
            }
        })
    );    
}

//push most of the logic into server side function
function processLine(eventline) {
    try {
        if(eventline.length > 0) {
            JSON.parse(eventline) //to test if it is valid JSON            
            stmt = "select AddEvent(:data)"
            db.query(stmt,{params:{data:escape(eventline)}})
                .then(function(response){ 
                rowCount++
            });
        }
    }
    catch(err) {
        console.log('invalid JSON line:')
        console.log(eventline)
        throw err
    }
}

// this is based on https://github.com/Axosoft/nsfw example
function startFileMonitor() {
    var nsfw = require('nsfw');
    var watcher2;
    return nsfw(
        directory_to_monitor,
        function(events) { // array of file action events
            for(i = 0, len = events.length; i < len; i++){
                elem = events[i]
                if(elem['action'] == 3) {
                    console.log(elem)
                    var newfile = "" + elem['directory'] + "/" + elem['newFile']
                    // expecting 'rotated' in the nxlog log file
                    if(newfile.indexOf('rotated') > -1){ 
                        setTimeout(function(){ processFile(newfile); }, 200)
                    }
                }
            }
        },
        {
        debounceMS: 250,
        errorCallback(errors) {
            //handle errors
        }
        })
        .then(function(watcher) {
        watcher2 = watcher;
        return watcher.start();
        })
}


