const directory_to_monitor = "C:/Windows/Datafusion/logs";
var OrientDB = require('orientjs');
var server = OrientDB({host: 'myorientdb', port: 2424});
var db = server.use({name: 'DataFusion', username: 'root', password: 'Password1234', useToken : true});
var fs = require('fs')
, es = require('event-stream'); //install first: npm i event-stream

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
        })
    );    
}

//port the python codes here
function processLine(eventline) {
    try {
        if(eventline.length > 0) {
            e = JSON.parse(eventline)
            e['ToBeProcessed'] = true
            classname = 'WinEvent'
            if(e['Keywords'] != undefined) {
                e['Keywords'] = '' + e['Keywords']
            }

            // Sysmon events
            if(e["SourceName"] == "Microsoft-Windows-Sysmon"){
                classname = eventIdLookup[e['EventID']]
                e['SysmonProcessId'] = e['ProcessID']
                delete e['ProcessID']
                var re = /ProcessId: (\d+)/g
                var match = re.exec(eventline)
                if(match != null)
                    e['ProcessId'] = parseInt(match[1])        
            }
            
            // DataFusion UAT events
            if(e["SourceName"] == "DataFuseUserActions"){
                classname = 'UserActionTracking'
                delete e['ProcessID']
                uat = JSON.parse(e['Message'])
                for(var k in uat){
                    e[k] = uat[k]
                }
            }

            // DataFusion network events
            if(e["SourceName"] == "DataFuseNetwork"){
                classname = 'NetworkDetails'
                delete e['ProcessID']
                uat = JSON.parse(e['Message'])
                for(var k in uat){
                    e[k] = uat[k]
                }
            }   

            delete e['Message'] //problematic for server-side parsing... it is repeated data anyway
            var l = JSON.stringify(e)
            // \r\n\t in fields will break ODB. If we replace b4 JSON parsing, it affects parsing of DataFusion events.
            if(classname == 'WinEvent'){ // only modify winEvent. Look at Taiga DataFusion issue #92
                l = l.replace(/(?:\\[rn])+/g, "\\\\r").replace(/(?:\\n)+/g, "\\\\n").replace(/(?:\\t)+/g, "\\\\t")
            }
            stmt = "select addEvent(:cn, '" + l +  "')" // using parameter with JSON string will fail...
            //console.log(stmt)  
            db.query(stmt,{params:{cn:classname}})
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

function startFileMonitor() {
    var nsfw = require('nsfw');
    var watcher2;
    return nsfw(
        directory_to_monitor,
        function(events) {
        // handles other events
            for(i = 0, len = events.length; i < len; i++){
                elem = events[i]
                if(elem['action'] == 3) {
                    console.log(elem)
                    var newfile = "" + elem['directory'] + "/" + elem['newFile']
                    if(newfile.indexOf('rotated') > -1){
                        processFile(newfile)
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

var lineCount = 0
var rowCount = 0

startFileMonitor() // starts directory monitoring for rotated logs
//processFile('/tmp/events.txt') // test single file

// tried ODB scheduler but it throws error due to "return"s within the scripts
// but runs fine from client.
setInterval(function(){ 
    db.query('select ConnectImageLoad()')
}, 3000);

setInterval(function(){ 
    db.query('select ConnectProcessAccess()')
}, 3000);