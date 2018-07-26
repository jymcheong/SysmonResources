const directory_to_monitor = "C:/Windows/Datafusion/logs";
// Start ODB stuff ---CHANGE IT TO SUIT YOUR ENVIRONMENT!---
var ODB_User = 'root'
var ODB_pass = 'Password1234'
var OrientDB = require('orientjs');
var server = OrientDB({host: 'myorientdb', port: 2424});
var db = server.use({name: 'DataFusion', username: ODB_User, password: ODB_pass, useToken : false});
// End ODB stuff -------------------------
// Use npm local install XXX instead of global, especially in Windoze!
var fs = require('fs'), es = require('event-stream'); //install first: npm i event-stream
var lineCount = 0
var rowCount = 0
var fileQueue = []

// https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
process.stdin.resume();//so the program will not close instantly
function exitHandler(options, err) {
    db.close().then(function(){
        process.exit();
    })
}
process.on('exit', exitHandler.bind(null,{cleanup:true}));
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

// please quickly start this script after VM starts up
// ODB cannot cope with too many backlog files
fs.readdir(directory_to_monitor, function(err, items) {
    console.log(items); 
    for (var i=0; i<items.length; i++) {
        if(items[i].indexOf('rotated')>= 0) {
            console.log('adding ' + items[i]);
            fileQueue.push(directory_to_monitor + '/' + items[i])
        }
    }
    processFile(fileQueue.shift())
});
//
startFileMonitor() // starts directory monitoring for rotated logs
//processFile('/tmp/events.txt') // test single file

//https://stackoverflow.com/questions/16010915/parsing-huge-logfiles-in-node-js-read-in-line-by-line
function processFile(filepath) {
    if(fs.existsSync(filepath) == false) return
    
    console.log('Processing ' + filepath)
    var s = fs.createReadStream(filepath)
        .pipe(es.split())
        .pipe(es.mapSync(function(line) {            
            // pause the readstream
            s.pause();
            // process line here and call s.resume() when rdy
            processLine(line)
            // resume the readstream, possibly from a callback
            s.resume();
        })
        .on('error', function(err){
            console.log('Error while reading file.', err);
        })
        .on('end', function(){
            console.log('Files in queue: ' + fileQueue.length)
            console.log('Total line count: ' + lineCount) // tally with row count
            console.log('Total row count:' + rowCount)
            
            setTimeout(function(){ // delayed delete to mitigate any file contention
            	fs.unlink(filepath, (err) => {
                  if (err) {
                    console.log(filepath + ' delete error');
                  }
                  else {
                    console.log(filepath + ' was deleted');
                  }    
                });
            },200)
         
            if(fileQueue.length > 0){
                processFile(fileQueue.shift())
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
            lineCount++
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

// based on https://github.com/Axosoft/nsfw example
function startFileMonitor() {
    var nsfw = require('nsfw');
    var watcher2;
    return nsfw(
        directory_to_monitor,
        function(events) { // array of file action events
            for(i = 0, len = events.length; i < len; i++){
                elem = events[i]
                if(elem['action'] == 3) { // only interested with file renamed
                    console.log(elem)
                    var newfile = "" + elem['directory'] + "/" + elem['newFile']
                    // expecting 'rotated' in the nxlog log file
                    if(newfile.indexOf('rotated') > -1){ 
                        fileQueue.push(newfile)
                        if(fileQueue.length > 0) setTimeout(function(){ processFile(fileQueue.shift()); }, 500)
                    }
                }
            }
        },
        {
            debounceMS: 250,
            errorCallback(errors) {
                console.log(errors)
            }
        })
        .then(function(watcher) {
            watcher2 = watcher;
            return watcher.start();
        })
}


