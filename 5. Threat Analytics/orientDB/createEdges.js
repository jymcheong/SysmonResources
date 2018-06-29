var OrientDB = require('orientjs');
var server = OrientDB({host: 'myorientdb', port: 2424});
var db = server.use({name: 'DataFusion', username: 'root', password: 'Password1234', useToken : true});

/**
 * Bulk create LoadedImage edges for a given ProcessCreate event
 * @param {string} pcprocessguid inserted event's ProcessGuid
 * @param {string} pchostname inserted event's Hostname
 */
function bulkCreateLoadedImage(pcprocessguid,pchostname) {
      db.query("select count(@rid) from ImageLoad WHERE ProcessGuid = :guid \
               AND Hostname = :hostname AND in().size() = 0",
               {params:{ guid: pcprocessguid,hostname: pchostname},limit: 1}).
              then(function(data){
                  newlimit = data[0].count
                  console.log('Processing LoadedImage edges... Create Edge limit: ' + newlimit);
                  if(newlimit > 0) {
                        db.query("select @rid from ImageLoad WHERE ProcessGuid = :guid AND \
                                  Hostname = :hostname AND in().size() = 0",{ params:{
                                    guid: pcprocessguid,
                                    hostname: pchostname
                              },limit: newlimit}).then(function(data){
                                    var size = data.length
                                    var TORIDs = '['
                                    data.forEach(elem => {
                                          TORIDs += ('#' + elem.rid.cluster + ':' + elem.rid.position)
                                          if(size > 1) {
                                                TORIDs += ","
                                          } else{
                                                TORIDs += "]"
                                          }
                                          size -= 1
                                          });
                                    //console.log(TORIDs)
                                    db.query("create Edge LoadedImage from (SELECT FROM ProcessCreate WHERE \
                                          ProcessGuid = :guid AND Hostname = :hostname) to " + TORIDs,
                                          {params:{guid:pcprocessguid,hostname:pchostname}})
                              })
                  }
         })
} 

// ==== Stage 2 - Run payload ====

/**
 *  Legend: FromClass-[EdgeClassName:PropertiesToLinkWith]->ToClass
 * Summary: Create ParentOf Edge for ProcessCreate Parent-Child vertices.
 * Description: Uses OrientDB Live Query to create edges when vertices are inserted.
 *              ProcessCreate-[ParentOf:ProcessGuid,Hostname]->ProcessCreate 
 * @param {ProcessCreate obj} inserted 
*/
db.liveQuery("live select from ProcessCreate")
  .on('live-insert', function(inserted){
     var child = inserted.content
     console.log(child.EventTime)
     console.log('inserted ProcessCreate ' + child.Image)  
     db.query("SELECT @rid FROM ProcessCreate WHERE ProcessGuid = :guid \
                  AND Hostname = :hostname",
                  {params:{ guid: child.ParentProcessGuid, hostname: child.Hostname},limit: 1}
            ).then(function(parent){
                if(parent.length > 0) { //when parent ProcessCreate event exist
                    console.log('Found ProcessCreate Parent')
                    console.log(JSON.stringify(parent[0].rid));   
                    //create edge between parent to current vertex
                    db.query('CREATE EDGE ParentOf FROM :rid TO (SELECT FROM ProcessCreate \
                             WHERE ProcessGuid = :guid AND Hostname = :hostname)',
                              {
                                 params:{
                                    rid: parent[0]['rid'],
                                    guid: child.ProcessGuid,
                                    hostname: child.Hostname
                                   }
                              }
                    );
                  }
                  
            });
      // do bulk ImageLoad linking here after some delay...
      setTimeout(() => {
            bulkCreateLoadedImage(child.ProcessGuid,child.Hostname) }, 2000);
  })



// Using RecordNumber together with ProcessGuid because the lack of @rid from OrientJS for live-query.
db.liveQuery("live select from CreateRemoteThread")
  .on('live-insert', function(data){
     var CreateRemoteThread = data.content;
     // ProcessCreate-[CreatedRemoteThread:SourceProcessGuid]->CreateRemoteThread
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = :guid AND Hostname = :hostname',
              {params:{guid: CreateRemoteThread.SourceProcessGuid,hostname: CreateRemoteThread.Hostname},
               limit: 1}
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                    db.query('CREATE EDGE CreatedThread FROM :rid TO \
                     (SELECT FROM CreateRemoteThread WHERE RecordNumber = :recordno \
                      AND SourceProcessGuid = :guid AND Hostname = :hostname',
                    {
                        params:{
                           rid: ProcessCreate[0].rid,
                           recordno: CreateRemoteThread.RecordNumber,
                           guid: CreateRemoteThread.SourceProcessGuid,
                           hostname: CreateRemoteThread.Hostname
                          }
                     }
                  );
              }
            });

      // CreateRemoteThread-[RemoteThreadFor:TargetProcessId]->ProcessCreate
      // this may have a problem because what if ProcessId is being reused in same host?
      db.query('SELECT @rid FROM ProcessCreate WHERE ProcessId = :pid AND Hostname = :hostname',
              {params:{pid: CreateRemoteThread.TargetProcessId,hostname: CreateRemoteThread.Hostname},limit: 1}
              ).then(function(ProcessCreate){
                        if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                              db.query('CREATE EDGE RemoteThreadFor FROM (SELECT FROM CreateRemoteThread \
                                    WHERE RecordNumber = :recordno AND SourceProcessGuid = :guid AND Hostname = :hostname) TO :rid',
                              {
                                  params:{
                                     recordno: CreateRemoteThread.RecordNumber,
                                     guid: CreateRemoteThread.SourceProcessGuid,
                                     hostname: CreateRemoteThread.Hostname,
                                     rid: ProcessCreate[0].rid
                                    }
                               });
                  }                
              });
  })

// ==== Stage 2 - Install Payload / Persistence ====

// ProcessCreate-[CreatedFile:ProcessGuid,Hostname]->FileCreate
db.liveQuery("live select from FileCreate")
  .on('live-insert', function(data){
     var FileCreate = data.content;
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = :guid AND Hostname = :hostname',
              {params:{guid: FileCreate.ProcessGuid,hostname: FileCreate.Hostname},limit: 1}
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                        db.query('CREATE EDGE CreatedFile FROM :rid TO \
                        (SELECT FROM FileCreate WHERE RecordNumber = :recordno \
                              AND ProcessGuid = :guid AND Hostname = :hostname)',
                         {
                              params:{
                                 rid: ProcessCreate[0].rid,
                                 recordno: FileCreate.RecordNumber,
                                 guid: FileCreate.ProcessGuid,
                                 hostname: FileCreate.Hostname
                                }
                           }
                        );
                  }                  
            });
   })

// FileCreate-[UsedAsDriver:TargetFilename=ImageLoaded]->DriverLoad
db.liveQuery("live select from DriverLoad")
  .on('live-insert', function(data){
     var DriverLoad = data.content;
     db.query('SELECT @rid FROM FileCreate WHERE TargetFilename = :filename AND Hostname = :hostname',
              {params:{filename: DriverLoad.ImageLoaded,hostname: DriverLoad.Hostname},limit: 1}
            ).then(function(FileCreate){
                  if(FileCreate.length > 0) { //when FileCreate event exist
                        db.query('CREATE EDGE UsedAsDriver FROM :rid TO \
                                 (SELECT FROM DriverLoad WHERE RecordNumber = :recordno \
                                 AND ImageLoaded = :path AND Hostname = :hostname)',
                              {
                                    params:{
                                        rid: FileCreate[0].rid,
                                        recordno: DriverLoad.RecordNumber,
                                        path: DriverLoad.ImageLoaded,
                                        hostname: DriverLoad.Hostname
                                    }
                              }
                        );
                  }
            });
   })

/*
db.liveQuery("live select from ImageLoad")
  .on('live-insert', function(data){
     var ImageLoad = data.content;
     // ProcessCreate-[LoadedImage:ProcessGuid,Hostname]->ImageLoad
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = :guid AND Hostname = :hostname',
              {
                  params:{
                       guid: ImageLoad.ProcessGuid,
                       hostname: ImageLoad.Hostname
                  },
                  limit: 1
              }
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                        db.query('CREATE EDGE LoadedImage FROM :rid TO \
                                    (SELECT FROM ImageLoad WHERE RecordNumber = :recordno \
                                    AND ProcessGuid = :guid AND Hostname = :hostname)',
                        {
                              params:{
                                    rid: ProcessCreate[0].rid,
                                    recordno: ImageLoad.RecordNumber,
                                    guid: ImageLoad.ProcessGuid,
                                    hostname: ImageLoad.Hostname
                              }
                        });
                  }
            });
      // FileCreate-[UsedAsImage:TargetFilename=ImageLoaded]->ImageLoad
      db.query('SELECT @rid FROM FileCreate WHERE TargetFilename = :imageloaded AND Hostname = :hostname',
            {
                  params:{
                        imageloaded: ImageLoad.ImageLoaded,
                        hostname: ImageLoad.Hostname 
                  },
                  limit: 1
            }
          ).then(function(FileCreate){
                if(FileCreate.length > 0) { //when FileCreate event exist
                        db.query('CREATE EDGE UsedAsImage FROM :rid TO (SELECT FROM ImageLoad WHERE \
                                   RecordNumber = :recordno AND ImageLoaded = :imageloaded \
                                   AND Hostname = :hostname)',
                                    {
                                          params:{
                                                rid: FileCreate[0].rid,
                                                recordno: ImageLoad.RecordNumber,
                                                imageloaded: ImageLoad.ImageLoaded,
                                                hostname: ImageLoad.Hostname
                                          }
                                    }
                        );
                }
          });
   })
*/

db.liveQuery("live select from RegistryEvent")
  .on('live-insert', function(data){
     var RegistryEvent = data.content;
     // ProcessCreate-[AccessedRegistry:ProcessGuid,Hostname]->RegistryEvent
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = :guid AND Hostname = :hostname',
              {params:{guid: RegistryEvent.ProcessGuid,hostname: RegistryEvent.Hostname},limit: 1}
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                        db.query('CREATE EDGE AccessedRegistry FROM :rid \
                                  TO (SELECT FROM RegistryEvent WHERE RecordNumber = :recordno \
                                  AND ProcessGuid = :guid AND Hostname = :hostname)',
                        {
                              params:{
                                    rid: ProcessCreate[0].rid,
                                    recordno: RegistryEvent.RecordNumber,
                                    guid: RegistryEvent.ProcessGuid,
                                    hostname: RegistryEvent.Hostname
                              }
                        });
                  }
            });
      // FileCreateStreamHash-[FoundWithin:TargetFilename in Details]->RegistryEvent
      // this assumes ADS created first before the registry event. Another case later which is the reverse
      db.query('SELECT @rid FROM FileCreateStreamHash \
                LET $re = (SELECT FROM RegistryEvent WHERE Details = :details AND RecordNumber = :recordno) \
                WHERE $re.Details.asString().indexOf(TargetFilename) > -1',
                {params:{details: RegistryEvent.Details,recordno: RegistryEvent.RecordNumber},limit: 1}
            ).then(function(FileCreateStreamHash){
                  if(FileCreateStreamHash.length > 0) { //when FileCreateStreamHash event exist
                        db.query('CREATE EDGE FoundWithin FROM :rid \
                                  TO (SELECT FROM RegistryEvent WHERE RecordNumber = :recordno \
                                    AND ProcessGuid = :guid AND Hostname = :hostname)',
                                 {
                                       params:{
                                             rid: FileCreateStreamHash[0].rid,
                                             recordno: RegistryEvent.RecordNumber,
                                             guid: RegistryEvent.ProcessGuid,
                                             hostname: RegistryEvent.Hostname
                                       }
                                 }   
                        );
                  }
            });

   })

// ProcessCreate-[CreatedFileStream:ProcessGuid,Hostname]->FileCreateStreamHash   
db.liveQuery("live select from FileCreateStreamHash")
  .on('live-insert', function(data){
     var FileCreateStreamHash = data.content;
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = :guid AND Hostname = :hostname',
              {params:{guid: FileCreateStreamHash.ProcessGuid,hostname: FileCreateStreamHash.Hostname},limit: 1}
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                        db.query('CREATE EDGE CreatedFileStream FROM :rid TO \
                                 (SELECT FROM FileCreateStreamHash WHERE RecordNumber = :recordno \
                                 AND ProcessGuid = :guid AND Hostname = :hostname)',
                         {
                               params:{
                                    rid: ProcessCreate[0].rid,
                                    recordno: FileCreateStreamHash.RecordNumber,
                                    guid: FileCreateStreamHash.ProcessGuid,
                                    hostname: FileCreateStreamHash.Hostname
                               }
                         }
                        );
                  }
            });            
      // FileCreateStreamHash-[FoundWithin:TargetFilename in Details]->RegistryEvent
      // this assumes registry event was created first, then the ADS   
      db.query('SELECT @rid FROM RegistryEvent WHERE Hostname = :hostname \
                AND Details.asString().indexOf(:filename) > -1',
               {params:{hostname: FileCreateStreamHash.Hostname,filename: FileCreateStreamHash.TargetFilename},limit: 1}
          ).then(function(RegistryEvent){
                if(RegistryEvent.length > 0) { //when RegistryEvent event exist
                      db.query('CREATE EDGE FoundWithin FROM (SELECT FROM FileCreateStreamHash WHERE RecordNumber = :recordno \
                                 AND ProcessGuid = :guid AND Hostname = :hostname) TO :rid',
                              {
                                    params:{
                                          recordno: FileCreateStreamHash.RecordNumber,
                                          guid: FileCreateStreamHash.ProcessGuid,
                                          hostname: FileCreateStreamHash.Hostname,
                                          rid: RegistryEvent[0].rid
                                    }
                              }
                      );
                }
            });
   })

/*
WMIevent has no exact link to ProcessCreate, this block is wrong

// ProcessCreate-[AccessedWMI:ProcessGuid,Hostname]->WmiEvent
db.liveQuery("live select from WmiEvent")
  .on('live-insert', function(data){
     var WmiEvent = data.content;
     //console.log('inserted: ' + JSON.stringify(WmiEvent));
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = :guid AND Hostname = :hostname',
              {params:{guid: WmiEvent.ProcessGuid,hostname: WmiEvent.Hostname},limit: 1}
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                        db.query('CREATE EDGE AccessedWMI FROM :rid \
                                 TO (SELECT FROM WmiEvent WHERE RecordNumber = :recordno \
                                 AND ProcessGuid = :guid AND Hostname = :hostname)',
                        {
                              params:{
                                    rid: ProcessCreate[0].rid,
                                    recordno: WmiEvent.RecordNumber,
                                    guid: WmiEvent.ProcessGuid,
                                    hostname: WmiEvent.Hostname
                              }
                        });
                  }
                  
            });
   })
*/

// ProcessCreate-[Terminated:ProcessGuid,Hostname]->ProcessTerminate     
db.liveQuery("live select from ProcessTerminate")
  .on('live-insert', function(data){
     var ProcessTerminate = data.content;
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = :guid AND Hostname = :hostname',
              {params:{guid: ProcessTerminate.ProcessGuid,hostname: ProcessTerminate.Hostname},limit: 1}
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                        db.query('CREATE EDGE Terminated FROM :rid TO \
                                  (SELECT FROM ProcessTerminate WHERE RecordNumber = :recordno \
                                    AND ProcessGuid = :guid AND Hostname = :hostname)',
                        {
                              params:{
                                    rid: ProcessCreate[0].rid,
                                    recordno: ProcessTerminate.RecordNumber,
                                    guid: ProcessTerminate.ProcessGuid,
                                    hostname: ProcessTerminate.Hostname
                              }
                        });
                  }
            });
   })

// Stage 2 & 3 - External/Internal C2 ====

// ProcessCreate-[ConnectedTo:ProcessGuid,Hostname]->NetworkConnect
db.liveQuery("live select from NetworkConnect")
  .on('live-insert', function(data){
     var NetworkConnect = data.content;
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = :guid AND Hostname = :hostname',
              {params:{guid: NetworkConnect.ProcessGuid,hostname: NetworkConnect.Hostname},limit: 1}
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                        db.query('CREATE EDGE ConnectedTo FROM :rid TO \
                                 (SELECT FROM NetworkConnect WHERE RecordNumber = :recordno \
                                 AND ProcessGuid = :guid AND Hostname = :hostname)',
                                {
                                      params:{
                                            rid: ProcessCreate[0].rid,
                                            recordno: NetworkConnect.RecordNumber,
                                            guid: NetworkConnect.ProcessGuid,
                                            hostname: NetworkConnect.Hostname
                                      }
                                }
                        );
                  }
                  
            });
   })

// ProcessCreate-[CreatedPipe:ProcessGuid,Hostname]->PipeCreate
db.liveQuery("live select from PipeCreated")
  .on('live-insert', function(data){
     var PipeCreated = data.content;
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = :guid AND Hostname = :hostname',
              {params:{guid: PipeCreated.ProcessGuid,hostname: PipeCreated.Hostname},limit: 1}
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                       db.query('CREATE EDGE CreatedPipe FROM :rid TO \
                              (SELECT FROM PipeCreated WHERE RecordNumber = :recordno \
                              AND ProcessGuid = :guid AND Hostname = :hostname)',
                              {
                                    params:{
                                          rid: ProcessCreate[0].rid,
                                          recordno: PipeCreated.RecordNumber,
                                          guid: PipeCreated.ProcessGuid,
                                          hostname: PipeCreated.Hostname
                                    }
                              });
                  }
                  
            });
   })

// ProcessCreate-[ConnectedPipe:ProcessGuid,Hostname]->PipeConnected
db.liveQuery("live select from PipeConnected")
  .on('live-insert', function(data){
     var PipeConnected = data.content;
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = :guid AND Hostname = :hostname',
              {params:{guid: PipeConnected.ProcessGuid,hostname: PipeConnected.Hostname},limit: 1}
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                        db.query('CREATE EDGE ConnectedPipe FROM :rid \
                                  TO (SELECT FROM PipeConnected WHERE RecordNumber = :recordno \
                                    AND ProcessGuid = :guid AND Hostname = :hostname)',
                        {
                              params:{
                                    rid: ProcessCreate[0].rid,
                                    recordno: PipeConnected.RecordNumber,
                                    guid: PipeConnected.ProcessGuid,
                                    hostname: PipeConnected.Hostname
                              }
                        });
                  }
                  
            });
   })

// ==== Stage 3 Capture Credentials - eg. Mimikatz ====

function bulkCreateProcessAccessed(){
      if(globalProcessAccessLeft > 0 || globalProcessAccessLeft == -1) return
      console.log('Bulk processing ProcessAccess function called...')
      globalProcessAccessLeft = -1 // such that it won't repeated call while waiting for Promise to complete
      db.query("SELECT FROM ProcessAccess WHERE ToBeProcessed = true Order By EventTime LIMIT 50"
              ).then(function(results){
                  console.log('Start processing ' + results.length + ' ProcessAccess events....')
                  globalProcessAccessLeft = results.length
                  results.forEach(item => {
                        // this timestamp will always increase whenever there's processing
                        db.query("update ProcessAccess set ToBeProcessed = false WHERE @rid = :rid",{params:{rid:item["@rid"]}})
                                .then(function(){ 
                                      globalProcessAccessLeft -= 1
                                      console.log('Process Access left to process: ' + globalProcessAccessLeft)
                                })
                        
                        try {
                              // create edge ProcessAccess -[ProcessAccessedTo]-> ProcessCreate
                              db.query("create Edge ProcessAccessedTo from :rid to (SELECT FROM ProcessCreate WHERE \
                              ProcessGuid = :guid AND Hostname = :hostname Order By EventTime LIMIT 1)",
                              {params:{rid:item["@rid"], guid:item.TargetProcessGUID, hostname:item.Hostname}})
                  
                        }
                        catch(err){
                        }
                        
                        try{
                              // create edge ProcessCreate -[ProcessAccessedFrom]-> ProcessAccess
                              db.query("create Edge ProcessAccessedFrom from (SELECT FROM ProcessCreate WHERE \
                              ProcessGuid = :guid AND Hostname = :hostname Order By EventTime LIMIT 1) to :rid",
                              {params:{guid:item.SourceProcessGUID, hostname:item.Hostname, rid:item["@rid"]}})
                        }
                        catch(err){

                        }
                        
                  })
               })
}

//var globalProcessAccessLeft = 0
// every 30 secs
//setInterval(bulkCreateProcessAccessed,30000)

/*
db.liveQuery("live select from ProcessAccess")
  .on('live-insert', function(data){
     var ProcessAccess = data.content;
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = :guid AND Hostname = :hostname',
              {
                    params:{
                        guid: ProcessAccess.SourceProcessGuid,
                        hostname: ProcessAccess.Hostname
                    },
                    limit: 1
              }
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                        // ProcessCreate-[ProcessAccessed:SourceProcessGuid]->ProcessAccess
                     db.query('CREATE EDGE ProcessAccessed FROM :rid TO \
                              (SELECT FROM ProcessAccess WHERE RecordNumber = :recordno \
                              AND SourceProcessGuid = :guid AND Hostname = :hostname)',
                        {
                           params:{
                                 rid: ProcessCreate[0].rid,
                                 recordno: ProcessAccess.RecordNumber,
                                 guid: ProcessAccess.SourceProcessGuid,
                                 hostname: ProcessAccess.Hostname
                           }   
                        });
                  }
                  
            });
      db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = :guid AND Hostname = :hostname',
            {
                  params:{
                        guid: ProcessAccess.TargetProcessGuid,
                        hostname: ProcessAccess.Hostname
                  },
                  limit: 1
            }
          ).then(function(ProcessCreate){
                if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                  // ProcessAccess-[ProcessAccessedFrom:TargetProcessGuid]->ProcessCreate
                        db.query('CREATE EDGE ProcessAccessedFrom FROM \
                                 (SELECT FROM ProcessAccess WHERE RecordNumber = :recordno \
                                  AND TargetProcessGuid = :guid AND Hostname = :hostname) TO :rid',
                        {
                              params:{
                                    recordno: ProcessAccess.RecordNumber,
                                    guid: ProcessAccess.TargetProcessGuid,
                                    hostname: ProcessAccess.Hostname,
                                    rid: ProcessCreate[0].rid
                              }
                        });
                }
                
          });
   })
*/


// Stage 4 - Steal ==== (Doesn't mean every RawAccessRead = stealing!)
// ProcessCreate-[RawRead:ProcessGuid,Hostname]->RawAccessRead
db.liveQuery("live select from RawAccessRead")
  .on('live-insert', function(data){
     var RawAccessRead = data.content;
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = :guid AND Hostname = :hostname',
              {params:{guid: RawAccessRead.ProcessGuid,hostname: RawAccessRead.Hostname},limit: 1}
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                        db.query('CREATE EDGE RawRead FROM :rid TO \
                              (SELECT FROM RawAccessRead WHERE RecordNumber = :recordno \
                              AND ProcessGuid = :guid AND Hostname = :hostname)',
                        {
                              params:{
                                    rid: ProcessCreate[0].rid,
                                    recordno: RawAccessRead.RecordNumber,
                                    guid: RawAccessRead.ProcessGuid,
                                    hostname: RawAccessRead.Hostname
                              }
                        });
                  }
                  
            });
   })


// Stage 4 - Tampering (Doesn't mean every FileCreateTime = tampering!)
// ProcessCreate-[ChangedFileCreateTime:ProcessGuid,Hostname]->FileCreateTime
db.liveQuery("live select from FileCreateTime")
  .on('live-insert', function(data){
     var FileCreateTime = data.content;
     db.query('SELECT @rid FROM ProcessCreate WHERE ProcessGuid = :guid AND Hostname = :hostname',
              {params:{guid: FileCreateTime.ProcessGuid,hostname: FileCreateTime.Hostname},limit: 1}
            ).then(function(ProcessCreate){
                  if(ProcessCreate.length > 0) { //when ProcessCreate event exist
                        db.query('CREATE EDGE ChangedFileCreateTime FROM :rid TO \
                                  (SELECT FROM FileCreateTime WHERE RecordNumber = :recordno \
                                    AND ProcessGuid = :guid AND Hostname = :hostname)',
                        {
                           params:{
                                 rid: ProcessCreate[0].rid,
                                 recordno: FileCreateTime.RecordNumber,
                                 guid: FileCreateTime.ProcessGuid,
                                 hostname: FileCreateTime.Hostname
                           }   
                        });
                  }
                  
            });
   })

//*/