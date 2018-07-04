  /**
   * 1. Use ODB WebStudio Function Management
   * 2. Create a function ConnectProcessAccess with NO parameters
   * 3. Paste the codes below into the FM's editor & save  
   */
  var db = orient.getDatabase();
  var N = 1000 // limit the number of records to process
  
  // 0. Check Function Status table, if running, quit
  // 1. Get ToBeProcessed 1st row's EventTime (startTime) ordered by EventTime ascending
  // 2. If no result, quit since nothing to do
  // 3. Update Function Status to "running" state
  // 4. Select ProcessCreate RID, Hostname & ProcessGuid matching first N ProcessAccess rows sorted by EventTime >= startTime
  // 5. Foreach rid & ProcessGuid, create edges from ProcessCreate RID to (ProcessAccess with matching Hostname, ProcessGuid and EventTime >= startTime sorted by EventTime LIMIT N)
  // 6. Update ToBeProcessed = false where EventTime >= startTime sorted by EventTime LIMIT N
  // 7. Update Function Status to "stopped" state when no more ProcessCreate to link
  
  // step 0 - don't run if it has already started
  var r = db.query('SELECT count(1) FROM FunctionStatus WHERE name = "ConnectProcessAccess" AND status = "running"');
  if(r.length) {
    print('ConnectProcessAccess still running...')
      return
  }
  
  // step 1 - find the earliest record time
  r = db.query('SELECT EventTime FROM ProcessAccess WHERE ToBeProcessed = true Order By EventTime ASC LIMIT ?', N);
  if(r.length == 0) { // step 2
    //print(Date() + ' ConnectProcessAccess nothing to do')
      return 
  }
  var startTime = r[0].getProperty('EventTime')
  
  // step 3 - start running state
  db.command('UPDATE FunctionStatus SET status = "running" WHERE name = "ConnectProcessAccess"')
  //print(Date() + ' changed ConnectProcessAccess status to running...')
  
  // step 4a - find those ProcessCreate in SourceProcessGUID
  r = db.query('SELECT @rid, ProcessGuid, Hostname FROM ProcessCreate \
          WHERE ProcessGuid in (SELECT SourceProcessGUID FROM ProcessAccess \
          WHERE ToBeProcessed = true AND EventTime >= ? ORDER BY EventTime limit ?)', startTime, N)
  if(r.length == 0) { 
    //print('ConnectProcessAccess did not find ProcessCreate from SourceProcessGUID')
  }
  else {
    print(Date() + ' ConnectProcessAccess found ' + r.length + ' ProcessCreate to process')
  }
  // step 5a - bulk edge creation
  for(var i=0; i < r.length; i++){
    print('Creating edges for ' + r[i].getProperty('@rid') + 
            ' ' + r[i].getProperty('Hostname') + ' ' + r[i].getProperty('ProcessGuid') )
      db.command('CREATE EDGE ProcessAccessedFrom FROM ? TO \
           (SELECT FROM ProcessAccess WHERE ToBeProcessed = true AND \
          EventTime >= ? AND Hostname = ? AND ProcessGuid = ? ORDER BY EventTime limit ?)',
                  r[i].getProperty('@rid'), startTime, 
              r[i].getProperty('Hostname'), r[i].getProperty('ProcessGuid'), N)
  }
  
// step 4b - find those ProcessCreate in TargetProcessGUID
  r = db.query('SELECT @rid, ProcessGuid, Hostname FROM ProcessCreate \
  WHERE ProcessGuid in (SELECT TargetProcessGUID FROM ProcessAccess \
  WHERE ToBeProcessed = true AND EventTime >= ? ORDER BY EventTime limit ?)', startTime, N)
  if(r.length == 0) { 
  //print('ConnectProcessAccess did not find ProcessCreate from SourceProcessGUID')
  }
  else {
    print(Date() + ' ConnectProcessAccess found ' + r.length + ' ProcessCreate to process')
  }
  // step 5b - bulk edge creation
  for(var i=0; i < r.length; i++){
    print('Creating edges for ' + r[i].getProperty('@rid') + 
        ' ' + r[i].getProperty('Hostname') + ' ' + r[i].getProperty('ProcessGuid') )
    db.command('CREATE EDGE ProcessAccessedTo FROM \
              (SELECT FROM ProcessAccess WHERE ToBeProcessed = true AND \
              EventTime >= ? AND Hostname = ? AND ProcessGuid = ? ORDER BY EventTime limit ?) TO ?', 
              startTime, r[i].getProperty('Hostname'), r[i].getProperty('ProcessGuid'), 
              N, r[i].getProperty('@rid'))
  }
  
  // step 6 - update ToBeProcessed
  db.command('UPDATE ProcessAccess SET ToBeProcessed = false \
              WHERE ToBeProcessed = true AND EventTime >= ? LIMIT ?',startTime, N)
  
  // step 7 - update function status
  db.command('UPDATE FunctionStatus SET status = "stopped" WHERE name = "ConnectProcessAccess"')
  //print(Date() + ' changed ConnectProcessAccess status to stopped...')
  
  return r