var OrientDB = require('orientjs');
var server = OrientDB({host: 'localhost', port: 2424});
var db = server.use({name: 'DataFusion', username: 'root', password: 'Password1234', useToken : true});

// ==== Stage 2 - Run payload ====

/* Legend: FromClass-[EdgeClassName:PropertiesToLinkWith]->ToClass
 * Summary: Create ParentOf Edge for ProcessCreate Parent-Child vertices.
 * Description: Uses OrientDB Live Query to create edges when vertices are inserted.
 *              ProcessCreate-[ParentOf:ProcessGuid,Hostname]->ProcessCreate 
 * @param {inserted vertex} data
*/
db.liveQuery("live select from ProcessCreate")
  .on('live-insert', function(inserted){
     var child = inserted.content;
     console.log('inserted: ' + JSON.stringify(child));
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = "' 
              + child.ParentProcessGuid + '" AND Hostname = "' + child.Hostname + '"'
            ).then(function(parent){
                  if(parent.length > 0) { //when parent ProcessCreate event exist
                    console.log(JSON.stringify(parent[0].rid));
                    //create edge between parent to current vertex
                    db.query('CREATE EDGE ParentOf FROM ' + parent[0].rid + 
                    ' TO (SELECT FROM ProcessCreate WHERE ProcessGuid ="' + child.ProcessGuid + 
                    '" AND Hostname = "' + child.Hostname + '")');
                  }
                  else
                    console.log('no parent found...')
            });
  })

// Using RecordNumber together with ProcessGuid because the lack of @rid from OrientJS.
db.liveQuery("live select from CreateRemoteThread")
  .on('live-insert', function(data){
     var CreateRemoteThread = data.content;
     console.log('inserted: ' + JSON.stringify(CreateRemoteThread));
     // ProcessCreate-[CreatedRemoteThread:SourceProcessGuid]->CreateRemoteThread
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = "' 
              + CreateRemoteThread.SourceProcessGuid + '" AND Hostname = "' + CreateRemoteThread.Hostname + '"'
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                    cmd = 'CREATE EDGE CreatedThread FROM ' + ProcessCreate[0].rid + 
                          ' TO (SELECT FROM CreateRemoteThread WHERE RecordNumber =' + CreateRemoteThread.RecordNumber + 
                          ' AND SourceProcessGuid = "' + CreateRemoteThread.SourceProcessGuid +
                          '" AND Hostname = "' + CreateRemoteThread.Hostname + '")';
                    console.log('command: ' + cmd);
                    db.query(cmd);
                  }
                  else
                    console.log('ProcessCreate vertex not found...')
            });

      // CreateRemoteThread-[RemoteThreadFor:TargetProcessId]->ProcessCreate
      db.query('SELECT @rid FROM ProcessCreate WHERE ProcessId = "' 
            + CreateRemoteThread.TargetProcessId + '" AND Hostname = "' + CreateRemoteThread.Hostname + '"'
          ).then(function(ProcessCreate){
                if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                  cmd = 'CREATE EDGE RemoteThreadFor FROM (SELECT FROM CreateRemoteThread WHERE RecordNumber = ' 
                  + CreateRemoteThread.RecordNumber + ' AND SourceProcessGuid = "' + CreateRemoteThread.SourceProcessGuid + 
                  '" AND Hostname = "' + CreateRemoteThread.Hostname + '") TO ' + ProcessCreate[0].rid;
                  console.log('command: ' + cmd);
                  db.query(cmd);
                }
                else
                  console.log('ProcessCreate vertex not found...')
          });
  })

// ==== Stage 2 - Install Payload / Persistence ====

// ProcessCreate-[WroteFile:ProcessGuid,Hostname]->FileCreate
db.liveQuery("live select from FileCreate")
  .on('live-insert', function(data){
     var FileCreate = data.content;
     console.log('inserted: ' + JSON.stringify(FileCreate));
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = "' 
              + FileCreate.ProcessGuid + '" AND Hostname = "' + FileCreate.Hostname + '"'
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                    cmd = 'CREATE EDGE WroteFile FROM ' + ProcessCreate[0].rid + 
                          ' TO (SELECT FROM FileCreate WHERE RecordNumber =' + FileCreate.RecordNumber + 
                          ' AND ProcessGuid = "' + FileCreate.ProcessGuid +
                          '" AND Hostname = "' + FileCreate.Hostname + '")';
                    console.log('command: ' + cmd);
                    db.query(cmd);
                  }
                  else
                    console.log('ProcessCreate vertex not found...')
            });
   })

// FileCreate-[UsedAsDriver:TargetFilename=ImageLoaded]->DriverLoad
// FileCreate-[UsedAsImage:TargetFilename=ImageLoaded]->ImageLoad

// ProcessCreate-[LoadedImage:ProcessGuid,Hostname]->ImageLoad
db.liveQuery("live select from ImageLoad")
  .on('live-insert', function(data){
     var ImageLoad = data.content;
     console.log('inserted: ' + JSON.stringify(ImageLoad));
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = "' 
              + ImageLoad.ProcessGuid + '" AND Hostname = "' + ImageLoad.Hostname + '"'
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                    cmd = 'CREATE EDGE LoadedImage FROM ' + ProcessCreate[0].rid + 
                          ' TO (SELECT FROM ImageLoad WHERE RecordNumber =' + ImageLoad.RecordNumber + 
                          ' AND ProcessGuid = "' + ImageLoad.ProcessGuid +
                          '" AND Hostname = "' + ImageLoad.Hostname + '")';
                    console.log('command: ' + cmd);
                    db.query(cmd);
                  }
                  else
                    console.log('ProcessCreate vertex not found...')
            });
   })

// ProcessCreate-[AccessedRegistry:ProcessGuid,Hostname]->RegistryEvent
db.liveQuery("live select from RegistryEvent")
  .on('live-insert', function(data){
     var RegistryEvent = data.content;
     console.log('inserted: ' + JSON.stringify(RegistryEvent));
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = "' 
              + RegistryEvent.ProcessGuid + '" AND Hostname = "' + RegistryEvent.Hostname + '"'
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                    cmd = 'CREATE EDGE AccessedRegistry FROM ' + ProcessCreate[0].rid + 
                          ' TO (SELECT FROM RegistryEvent WHERE RecordNumber =' + RegistryEvent.RecordNumber + 
                          ' AND ProcessGuid = "' + RegistryEvent.ProcessGuid +
                          '" AND Hostname = "' + RegistryEvent.Hostname + '")';
                    console.log('command: ' + cmd);
                    db.query(cmd);
                  }
                  else
                    console.log('ProcessCreate vertex not found...')
            });
   })

// ProcessCreate-[CreatedFileStream:ProcessGuid,Hostname]->FileCreateStreamHash   
db.liveQuery("live select from FileCreateStreamHash")
  .on('live-insert', function(data){
     var FileCreateStreamHash = data.content;
     console.log('inserted: ' + JSON.stringify(FileCreateStreamHash));
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = "' 
              + FileCreateStreamHash.ProcessGuid + '" AND Hostname = "' + FileCreateStreamHash.Hostname + '"'
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                    cmd = 'CREATE EDGE CreatedFileStream FROM ' + ProcessCreate[0].rid + 
                          ' TO (SELECT FROM FileCreateStreamHash WHERE RecordNumber =' + FileCreateStreamHash.RecordNumber + 
                          ' AND ProcessGuid = "' + FileCreateStreamHash.ProcessGuid +
                          '" AND Hostname = "' + FileCreateStreamHash.Hostname + '")';
                    console.log('command: ' + cmd);
                    db.query(cmd);
                  }
                  else
                    console.log('ProcessCreate vertex not found...')
            });
   })

// FileCreateStreamHash-[FoundWithin:TargetFilename in Details]->RegistryEvent

// ProcessCreate-[AccessedWMI:ProcessGuid,Hostname]->WmiEvent
db.liveQuery("live select from WmiEvent")
  .on('live-insert', function(data){
     var WmiEvent = data.content;
     console.log('inserted: ' + JSON.stringify(WmiEvent));
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = "' 
              + WmiEvent.ProcessGuid + '" AND Hostname = "' + WmiEvent.Hostname + '"'
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                    cmd = 'CREATE EDGE AccessedWMI FROM ' + ProcessCreate[0].rid + 
                          ' TO (SELECT FROM WmiEvent WHERE RecordNumber =' + WmiEvent.RecordNumber + 
                          ' AND ProcessGuid = "' + WmiEvent.ProcessGuid +
                          '" AND Hostname = "' + WmiEvent.Hostname + '")';
                    console.log('command: ' + cmd);
                    db.query(cmd);
                  }
                  else
                    console.log('ProcessCreate vertex not found...')
            });
   })

// ProcessCreate-[Terminated:ProcessGuid,Hostname]->ProcessTerminate     
db.liveQuery("live select from ProcessTerminate")
  .on('live-insert', function(data){
     var ProcessTerminate = data.content;
     console.log('inserted: ' + JSON.stringify(ProcessTerminate));
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = "' 
              + ProcessTerminate.ProcessGuid + '" AND Hostname = "' + ProcessTerminate.Hostname + '"'
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                    cmd = 'CREATE EDGE Terminated FROM ' + ProcessCreate[0].rid + 
                          ' TO (SELECT FROM ProcessTerminate WHERE RecordNumber =' + ProcessTerminate.RecordNumber + 
                          ' AND ProcessGuid = "' + ProcessTerminate.ProcessGuid +
                          '" AND Hostname = "' + ProcessTerminate.Hostname + '")';
                    console.log('command: ' + cmd);
                    db.query(cmd);
                  }
                  else
                    console.log('ProcessCreate vertex not found...')
            });
   })

// Stage 2 & 3 - External/Internal C2 ====

// ProcessCreate-[ConnectedTo:ProcessGuid,Hostname]->NetworkConnect
db.liveQuery("live select from NetworkConnect")
  .on('live-insert', function(data){
     var NetworkConnect = data.content;
     console.log('inserted: ' + JSON.stringify(NetworkConnect));
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = "' 
              + NetworkConnect.ProcessGuid + '" AND Hostname = "' + NetworkConnect.Hostname + '"'
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                    cmd = 'CREATE EDGE ConnectedTo FROM ' + ProcessCreate[0].rid + 
                          ' TO (SELECT FROM NetworkConnect WHERE RecordNumber =' + NetworkConnect.RecordNumber + 
                          ' AND ProcessGuid = "' + NetworkConnect.ProcessGuid +
                          '" AND Hostname = "' + NetworkConnect.Hostname + '")';
                    console.log('command: ' + cmd);
                    db.query(cmd);
                  }
                  else
                    console.log('ProcessCreate vertex not found...')
            });
   })

// ProcessCreate-[CreatedPipe:ProcessGuid,Hostname]->PipeCreate
db.liveQuery("live select from PipeCreate")
  .on('live-insert', function(data){
     var PipeCreate = data.content;
     console.log('inserted: ' + JSON.stringify(PipeCreate));
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = "' 
              + PipeCreate.ProcessGuid + '" AND Hostname = "' + PipeCreate.Hostname + '"'
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                    cmd = 'CREATE EDGE CreatedPipe FROM ' + ProcessCreate[0].rid + 
                          ' TO (SELECT FROM PipeCreate WHERE RecordNumber =' + PipeCreate.RecordNumber + 
                          ' AND ProcessGuid = "' + PipeCreate.ProcessGuid +
                          '" AND Hostname = "' + PipeCreate.Hostname + '")';
                    console.log('command: ' + cmd);
                    db.query(cmd);
                  }
                  else
                    console.log('ProcessCreate vertex not found...')
            });
   })

// ProcessCreate-[ConnectedPipe:ProcessGuid,Hostname]->PipeConnected
db.liveQuery("live select from PipeConnected")
  .on('live-insert', function(data){
     var PipeConnected = data.content;
     console.log('inserted: ' + JSON.stringify(PipeConnected));
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = "' 
              + PipeConnected.ProcessGuid + '" AND Hostname = "' + PipeConnected.Hostname + '"'
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                    cmd = 'CREATE EDGE ConnectedPipe FROM ' + ProcessCreate[0].rid + 
                          ' TO (SELECT FROM PipeConnected WHERE RecordNumber =' + PipeConnected.RecordNumber + 
                          ' AND ProcessGuid = "' + PipeConnected.ProcessGuid +
                          '" AND Hostname = "' + PipeConnected.Hostname + '")';
                    console.log('command: ' + cmd);
                    db.query(cmd);
                  }
                  else
                    console.log('ProcessCreate vertex not found...')
            });
   })

// ==== Stage 3 Capture Credentials - eg. Mimikatz ====

db.liveQuery("live select from ProcessAccess")
  .on('live-insert', function(data){
     var ProcessAccess = data.content;
     console.log('inserted: ' + JSON.stringify(ProcessAccess));
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = "' 
              + ProcessAccess.SourceProcessGuid + '" AND Hostname = "' + ProcessAccess.Hostname + '"'
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                    // ProcessCreate-[ProcessAccessed:SourceProcessGuid]->ProcessAccess
                    cmd = 'CREATE EDGE ProcessAccessed FROM ' + ProcessCreate[0].rid + 
                          ' TO (SELECT FROM ProcessAccess WHERE RecordNumber =' + ProcessAccess.RecordNumber + 
                          ' AND SourceProcessGuid = "' + ProcessAccess.SourceProcessGuid +
                          '" AND Hostname = "' + ProcessAccess.Hostname + '")';
                    console.log('command: ' + cmd);
                    db.query(cmd);
                  }
                  else
                    console.log('ProcessCreate vertex not found...')
            });
      db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = "' 
            + ProcessAccess.TargetProcessGuid + '" AND Hostname = "' + ProcessAccess.Hostname + '"'
          ).then(function(ProcessCreate){
                if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                  // ProcessAccess-[ProcessAccessedFrom:TargetProcessGuid]->ProcessCreate
                  cmd = 'CREATE EDGE ProcessAccessedFrom FROM (SELECT FROM ProcessAccess WHERE RecordNumber = ' 
                  + ProcessAccess.RecordNumber + ' AND TargetProcessGuid = "' + ProcessAccess.TargetProcessGuid + 
                  '" AND Hostname = "' + ProcessAccess.Hostname + '") TO ' + ProcessCreate[0].rid;
                  console.log('command: ' + cmd);
                  db.query(cmd);
                }
                else
                  console.log('ProcessCreate vertex not found...')
          });
   })



// Stage 4 - Steal ==== (Doesn't mean every RawAccessRead = stealing!)
// ProcessCreate-[RawRead:ProcessGuid,Hostname]->RawAccessRead
db.liveQuery("live select from RawAccessRead")
  .on('live-insert', function(data){
     var RawAccessRead = data.content;
     console.log('inserted: ' + JSON.stringify(RawAccessRead));
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = "' 
              + RawAccessRead.ProcessGuid + '" AND Hostname = "' + RawAccessRead.Hostname + '"'
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                    cmd = 'CREATE EDGE RawRead FROM ' + ProcessCreate[0].rid + 
                          ' TO (SELECT FROM RawAccessRead WHERE RecordNumber =' + RawAccessRead.RecordNumber + 
                          ' AND ProcessGuid = "' + RawAccessRead.ProcessGuid +
                          '" AND Hostname = "' + RawAccessRead.Hostname + '")';
                    console.log('command: ' + cmd);
                    db.query(cmd);
                  }
                  else
                    console.log('ProcessCreate vertex not found...')
            });
   })


// Stage 4 - Tampering (Doesn't mean every FileCreateTime = tampering!)
// ProcessCreate-[ChangedFileCreateTime:ProcessGuid,Hostname]->FileCreateTime
db.liveQuery("live select from FileCreateTime")
  .on('live-insert', function(data){
     var FileCreateTime = data.content;
     console.log('inserted: ' + JSON.stringify(FileCreateTime));
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = "' 
              + FileCreateTime.ProcessGuid + '" AND Hostname = "' + FileCreateTime.Hostname + '"'
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                    cmd = 'CREATE EDGE ChangedFileCreateTime FROM ' + ProcessCreate[0].rid + 
                          ' TO (SELECT FROM FileCreateTime WHERE RecordNumber =' + FileCreateTime.RecordNumber + 
                          ' AND ProcessGuid = "' + FileCreateTime.ProcessGuid +
                          '" AND Hostname = "' + FileCreateTime.Hostname + '")';
                    console.log('command: ' + cmd);
                    db.query(cmd);
                  }
                  else
                    console.log('ProcessCreate vertex not found...')
            });
   })
