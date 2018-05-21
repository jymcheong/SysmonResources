var OrientDB = require('orientjs');
var server = OrientDB({host: 'localhost', port: 2424});
var db = server.use({name: 'DataFusion', username: 'root', password: 'Password1234', useToken : true});

//build ProcessCreate Parent-Child relationships
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
