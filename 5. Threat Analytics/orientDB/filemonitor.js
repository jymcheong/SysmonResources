//==== Configure here ========
const directory_to_monitor = 'C:/Windows/Datafusion/logs'
var OrientDB = require('orientjs');
var server = OrientDB({host: 'localhost', port: 2424});
var db = server.use({name: 'DataFusion', username: 'root', password: 'Password1234', useToken : true});
//==================================
const eventIdLookup = {1:'ProcessCreate', 2:'FileCreateTime', 3:'NetworkConnect', 
                        4:'SysmonStatus', 5:'ProcessTerminate',6:'DriverLoad', 
                        7:'ImageLoad', 8:'CreateRemoteThread', 9:'RawAccessRead', 
                        10:'ProcessAccess', 11:'FileCreate', 12:'RegistryEvent', 
                        13:'RegistryEvent', 14:'RegistryEvent', 15:'FileCreateStreamHash', 
                        16:'ConfigChanged', 17:'PipeCreated', 18:'PipeConnected', 
                        19:'WmiEvent', 20:'WmiEvent', 21:'WmiEvent', 255:'Error' }

//https://stackoverflow.com/questions/16010915/parsing-huge-logfiles-in-node-js-read-in-line-by-line
function processFile(filepath) {
    var fs = require('fs')
    , es = require('event-stream'); //install first: npm i event-stream
    var s = fs.createReadStream(filepath)
        .pipe(es.split())
        .pipe(es.mapSync(function(line){
            
            // pause the readstream
            s.pause();

            // process line here and call s.resume() when rdy
            console.log(line)

            //port the python codes here
            
            // resume the readstream, possibly from a callback
            s.resume();
        })
        .on('error', function(err){
            console.log('Error while reading file.', err);
        })
        .on('end', function(){
            console.log('Read entire file.')
        })
    );    
}

function startFileMonitor() {
    var nsfw = require('nsfw');
    var watcher2;
    return nsfw(
        "C:/Windows/Datafusion/logs",
        function(events) {
        // handles other events
            for(i = 0, len = events.length; i < len; i++){
                elem = events[i]
                if(elem['action'] == 3) {
                    console.log(elem)
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
        .then(function() {
        // we are now watching dir2 for events!
        })
        .then(function() {
        // To stop watching
        //watcher2.stop();
        })
}

startFileMonitor()