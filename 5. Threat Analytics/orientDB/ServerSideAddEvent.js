/**
 * 1. Use ODB WebStudio Function Management
 * 2. Create a function AddEvent with two parameters: classname, jsondata
 * 3. Paste the codes below into the FM's editor & save  
 */
var db = orient.getDatabase();

//need to do this since it won't return the record
var e = JSON.parse(jsondata); 
print(e["ProcessGuid"]) // need this to find ProcessCreate eg. ProcessGuid

// Insert cannot use parameters. RETURN @this will crash the whole system
var r = db.command('insert into '+ classname + ' content ' + jsondata);

return r 