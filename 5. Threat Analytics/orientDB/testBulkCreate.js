var OrientDB = require('orientjs');
var server = OrientDB({host: 'myorientdb', port: 2424});
var db = server.use({name: 'DataFusion', username: 'root', password: 'Password1234', useToken : true});

var pcprocessguid = "{B231F4AB-5171-5B30-0000-0010C05DF405}"
var pchostname = "DESKTOP-O153T4R"


function bulkCreateLoadedImage(pcprocessguid,pchostname) {
      db.query("select count(@rid) from ImageLoad WHERE ProcessGuid = :guid \
               AND Hostname = :hostname AND in().size() = 0",
         {params:{ guid: pcprocessguid,hostname: pchostname},limit: 1}).then(function(data){
                  newlimit = data[0].count
                  console.log('Create Edge limit: ' + newlimit);
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

/**
 * 
 * @param {event object} ProcessAccess 
 */
function bulkCreateProcessAccessed(ProcessAccess){
      console.log(ProcessAccess.RecordNumber);
      var PArid = '#' + ProcessAccess["@rid"].cluster + ':' + ProcessAccess["@rid"].position 
      console.log(PArid);
      var recno = ProcessAccessLastRecordNo < ProcessAccess.RecordNumber? ProcessAccessLastRecordNo : ProcessAccess.RecordNumber   
      db.query("SELECT FROM ProcessAccess WHERE RecordNumber >= :recordno AND Hostname = :hostname AND in().size() = 0 AND out().size() = 0 Order By RecordNumber", 
               {params:{recordno: recno, hostname: ProcessAccess.Hostname}, limit:500}
              ).then(function(results){
                  console.log(results.length)
                  results.forEach(item => {
                        console.log(item.SourceProcessGUID)
                        // create edge ProcessAccess -[ProcessAccessedTo]-> ProcessCreate
                        db.query("create Edge ProcessAccessedTo from :rid to (SELECT FROM ProcessCreate WHERE \
                              ProcessGuid = :guid AND Hostname = :hostname Order By EventTime LIMIT 1)",
                              {params:{rid: item["@rid"], guid:item.TargetProcessGUID, hostname:item.Hostname}})
                        // create edge ProcessCreate -[ProcessAccessedFrom]-> ProcessAccess
                        db.query("create Edge ProcessAccessedFrom from (SELECT FROM ProcessCreate WHERE \
                              ProcessGuid = :guid AND Hostname = :hostname Order By EventTime LIMIT 1) to :rid",
                              {params:{guid:item.SourceProcessGUID, hostname:item.Hostname, rid: item["@rid"]}})
                        ProcessAccessLastRecordNo = item.RecordNumber
                        console.log(ProcessAccessLastRecordNo)
                  })
               })
}

//setTimeout(() => { bulkCreateLoadedImage(pcprocessguid,pchostname) }, 3000);

var ProcessAccessLastRecordNo = 17177333

db.query('SELECT FROM ProcessAccess WHERE RecordNumber = 17177333').then(function(data){
      bulkCreateProcessAccessed(data[0])
})