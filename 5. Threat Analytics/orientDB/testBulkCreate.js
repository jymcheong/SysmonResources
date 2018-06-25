var OrientDB = require('orientjs');
var server = OrientDB({host: 'myorientdb', port: 2424});
var db = server.use({name: 'DataFusion', username: 'root', password: 'Password1234', useToken : true});

var pcprocessguid = "{B231F4AB-5171-5B30-0000-0010C05DF405}"
var pchostname = "DESKTOP-O153T4R"


function bulkCreateLoadedImage(pcprocessguid,pchostname) {
      db.query("select count(@rid) from ImageLoad WHERE ProcessGuid = :guid AND Hostname = :hostname AND in().size() = 0",
         {params:{
            guid: pcprocessguid,
            hostname: pchostname},limit: 1}
        ).then(function(data){
            newlimit = data[0].count
            console.log('Create Edge limit: ' + newlimit);
            if(newlimit > 0) {
                  db.query("select @rid from ImageLoad WHERE ProcessGuid = :guid AND Hostname = :hostname AND in().size() = 0",
                        {params:{
                              guid: pcprocessguid,
                              hostname: pchostname
                        },limit: newlimit}
                        ).then(function(data){
                              var size = data.length
                              var TORIDs = '['
                              data.forEach(element => {
                                    TORIDs += ('#' + element.rid.cluster + ':' + element.rid.position)
                                    if(size > 1) {
                                          TORIDs += ","
                                    } else{
                                          TORIDs += "]"
                                    }
                                    size -= 1
                                    }
                                    );
                              //console.log(TORIDs)
                              db.query("create Edge LoadedImage from (SELECT FROM ProcessCreate WHERE \
                                       ProcessGuid = :guid AND Hostname = :hostname) to " + TORIDs,
                                       {params:{guid:pcprocessguid,hostname:pchostname}})
                        })
            }
         })
} 

bulkCreateLoadedImage(pcprocessguid,pchostname)
