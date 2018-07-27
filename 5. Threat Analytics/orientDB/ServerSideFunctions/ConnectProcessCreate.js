/**
 * 1. Use ODB WebStudio Function Management
 * 2. Create a JAVASCRIPT function ConnectProcessCreate with NO parameters
 * 3. Paste the codes below into the FM's editor & save  
 */
var db = orient.getDatabase();
var N = 1000 // limit the number of records to process

// step 0 - don't run if it has already started
var r = db.query('SELECT count(1) FROM FunctionStatus WHERE name = "ConnectProcessCreate" AND status = "running"');
if (r.length > 0) {
    print('ConnectProcessCreate still running...')
    return
}

// step 1 - find the last record time
r = null
r = db.query('SELECT @rid, id, Hostname, ProcessGuid, ParentProcessGuid FROM ProcessCreate WHERE ToBeProcessed = true Order By id ASC LIMIT ?', N);
if (r.length == 0) { // step 2
    print(Date() + ' ConnectProcessCreate nothing to do')
    return
}
var endID = r[r.length - 1].getProperty('id')

// step 3 - start running state
db.command('UPDATE FunctionStatus SET status = "running" WHERE name = "ConnectProcessCreate"')
print(Date() + ' changed ConnectProcessCreate status to running... ' + r.length)
print(Date() + ' ConnectProcessCreate found... ' + r.length)

if (r.length > 0) {   // step 5 - edge creation
    for (var i = 0; i < r.length; i++) {
        try {
            print(Date() + ' Processing ParentOf for ' + r[i].getProperty('Image'))
            db.command('CREATE EDGE ParentOf FROM (SELECT FROM ProcessCreate WHERE Hostname = ? AND ProcessGuid = ?) TO ? RETRY 3 WAIT 500',
                        r[i].getProperty('Hostname'), r[i].getProperty('ParentProcessGuid'), r[i].getProperty('@rid'))
        }
        catch (err) {
            print(Date() + ' - No parent for ' + r[i].getProperty('Image') + ' ' + err)
        }
    }
}

// step 6 - update ToBeProcessed N rows starting from startTime
db.command('UPDATE ProcessCreate SET ToBeProcessed = false WHERE ToBeProcessed = true AND id <= ? LIMIT ?', endID, N)

// step 7 - update function status
db.command('UPDATE FunctionStatus SET status = "stopped" WHERE name = "ConnectProcessCreate"')
print(Date() + ' changed ConnectProcessCreate status to stopped...')
