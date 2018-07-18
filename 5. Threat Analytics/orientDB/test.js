// Start ODB stuff -----------------------
var ODB_User = 'root'
var ODB_pass = 'Password1234'
var OrientDB = require('orientjs');
var server = OrientDB({host: 'myorientdb', port: 2424});
var db = server.use({name: 'DataFusion', username: ODB_User, password: ODB_pass, useToken : true});

db.open().then(function(){
    db.query("select from functionstatus").then(function(res){
        console.log(res)
    }).then(function(){
        db.close()
    })
})
