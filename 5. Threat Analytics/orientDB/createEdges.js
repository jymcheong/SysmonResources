var OrientDB = require('orientjs');
var server = OrientDB({host: 'localhost', port: 2424});
var db = server.use({name: 'DataFusion', username: 'root', password: 'Password1234', useToken : true});

//create ProcessCreate Parent-Child relationships
db.liveQuery("live select from ProcessCreate")
  .on('live-insert', function(data){
     var child = data.content;
     // your code here...
     console.log('inserted ' + JSON.stringify(child));
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = "' 
              + child.ParentProcessGuid + '" AND Hostname = "' + child.Hostname + '"'
            ).then(function(parent){
                  if(parent.length > 0) { //when parent ProcessCreate event exist
                    console.log(JSON.stringify(parent[0].rid));
                    //create edge between parent to current vertex
                    db.query('CREATE EDGE ParentOf FROM ' + parent[0].rid + 
                    ' TO (SELECT FROM ProcessCreate WHERE ProcessGuid ="' + child.ProcessGuid + 
                    '" AND Hostname = "' + child.Hostname + 
                    '")');
                  }
                  else
                    console.log('no parent found...')
            });
  })

// Legend: FromClass-[EdgeClassName:PropertiesToLinkWith]->ToClass

// Stage 2 - Run payload eg. MSF Process Migration creates remote threads
// ProcessCreate-[CreatedRemoteThread:SourceProcessGuid]->CreateRemoteThread
// CreateRemoteThread-[RemoteThreadFor:TargetProcessId]->ProcessCreate

// Stage2 - Install Payload / Persistence
// ProcessCreate-[WroteFile:ProcessGuid,Hostname]->FileCreate
// FileCreate-[UsedAsDriver:TargetFilename=ImageLoaded]->DriverLoad
// FileCreate-[UsedAsImage:TargetFilename=ImageLoaded]->ImageLoad
// ProcessCreate-[LoadedImage:ProcessGuid,Hostname]->ImageLoad
// ProcessCreate-[AccessedRegistry:ProcessGuid,Hostname]->RegistryEvent
// ProcessCreate-[CreatedFileStream:ProcessGuid,Hostname]->FileCreateStreamHash
// ProcessCreate-[AccessedWMI:ProcessGuid,Hostname]->WmiEvent
// ProcessCreate-[Terminated:ProcessGuid,Hostname]->ProcessTerminate

// Stage2/3 External-Internal C2
// ProcessCreate-[ConnectedTo:ProcessGuid,Hostname]->NetworkConnect
// ProcessCreate-[CreatedPipe:ProcessGuid,Hostname]-> PipeCreate
// ProcessCreate-[ConnectedPipe:ProcessGuid,Hostname]->PipeConnected

// Stage3 Capture Credentials - eg. Mimikatz
// ProcessCreate-[ProcessAccessed:SourceProcessGuid]->ProcessAccess
// ProcessAccess-[ProcessAccessedFrom:TargetProcessGuid]->ProcessCreate

// Stage 4 - Steal
// ProcessCreate-[RawRead:ProcessGuid,Hostname]->RawAccessRead

// Stage 4 - Tampering (Doesn't mean every FileCreateTime = tampering!)
// ProcessCreate-[ChangedFileCreateTime:ProcessGuid,Hostname]->FileCreateTime
