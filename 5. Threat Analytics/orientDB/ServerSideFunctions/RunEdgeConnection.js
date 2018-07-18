/**
* 1. Use ODB WebStudio Function Management
* 2. Create a function RunEdgeConnection
* 3. Paste the codes below into the FM's editor & save  
* 4. Use ODB Console or Browse tab to issue this statement to run it every 5 seconds:

INSERT INTO oschedule SET name = 'ConnectEdges', function = (SELECT FROM ofunction WHERE name = 'RunEdgeConnection'), rule = "0/5 * * * * ?"

* 5. These two event types are disabled by default unless customize Sysmon Configuration turned them on
* 6. Depending on the Sysmon configuration filtering, other events could be massive too like NetworkConnect, Registry & File related 
*/

var db = orient.getDatabase();
db.query("select ConnectImageLoad()")
db.query("select ConnectProcessAccess()")