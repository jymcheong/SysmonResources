/**
 * 1. Use ODB WebStudio Function Management
 * 2. Create a JAVASCRIPT function ConnectProcessCreate with NO parameters
 * 3. Paste the codes below into the FM's editor & save  
 */
var db = orient.getDatabase();

// step 1.1 - find the last record time
r = null
r = db.query('SELECT FROM ProcessCreate WHERE ParentImage <> "System" AND in("ParentOf").size() = 0 \
             AND ToBeProcessed = false AND ParentProcessGuid in (Select ProcessGuid from processcreate)');
if (r.length == 0) { // step 1.2
    return 
}

if (r.length > 0) {   // step 2.1 - edge creation
    for (var i = 0; i < r.length; i++) {
        try { // step 2.2
            print("\n"+ Date() + ' Processing ParentOf for ' + r[i].getProperty('Image'))
            db.command('CREATE EDGE ParentOf FROM (SELECT FROM ProcessCreate WHERE Hostname = ? AND ProcessGuid = ?) TO ? RETRY 3 WAIT 500',
                        r[i].getProperty('Hostname'), r[i].getProperty('ParentProcessGuid'), r[i].getProperty('@rid'))
        }
        catch (err) {
            print("\n"+ Date() + ' - No parent for ' + r[i].getProperty('Image') + ' ' + err)
        }
    }
}

