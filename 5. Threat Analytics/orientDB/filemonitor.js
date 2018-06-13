//==== Configure here
const directory_to_monitor = '/tmp'
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

// test the lookup table
//console.log(eventIdLookup[1]) 

// test line by line read
//processFile(__dirname + '/events.txt') 

var nsfw = require('nsfw');

var watcher1;
return nsfw(
  directory_to_monitor,
  function(events) {
    // handle events
    console.log(events)
  })
  .then(function(watcher) {
    watcher1 = watcher;
    return watcher.start();
  })
  .then(function() {
    // we are now watching dir1 for events!
    
    // To stop watching
    //watcher1.stop()
  });

//process.stdin.resume();
