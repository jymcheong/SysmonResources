/**
* 1. Use ODB WebStudio Function Management
* 2. Create a function RunEdgeConnection
* 3. Paste the codes below into the FM's editor & save  
* 4. Use ODB Console or Browse tab to issue this statement to run it every 5 seconds:

INSERT INTO oschedule SET name = 'ConnectEdges', function = (SELECT FROM ofunction WHERE name = 'RunEdgeConnection'), rule = "0/5 * * * * ?"
OR
UPDATE oschedule SET rule = "0/4 * * * * ?" WHERE name = 'ConnectEdges'
*/

var db = orient.getDatabase();
db.query("select ConnectProcessCreate()")
db.query("select ConnectImageLoad()")
db.query("select ConnectProcessAccess()")
db.query("select ConnectProcessCreateOrphans()")