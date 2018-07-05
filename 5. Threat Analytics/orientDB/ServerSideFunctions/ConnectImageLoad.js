  /**
   * 1. Use ODB WebStudio Function Management
   * 2. Create a function ProcessImageLoad with NO parameters
   * 3. Paste the codes below into the FM's editor & save  
   */
  var db = orient.getDatabase();
  var N = 1000 // limit the number of records to process
  
  // 0. Check Function Status table, if running, quit
  // 1. Get 1st row's EventTime (startTime) ordered by EventTime ascending
  // 2. If no result, quit 
  // 3. Update Function Status to "running" state
  // 4. Select ProcessCreate RID, Hostname & ProcessGuid matching first N ImageLoad rows sorted by EventTime >= startTime
  // 5. Foreach rid & ProcessGuid, create edges from ProcessCreate RID to (ImageLoad with matching Hostname, ProcessGuid and EventTime >= startTime sorted by EventTime LIMIT N)
  // 6. Update ToBeProcessed = false where EventTime >= startTime sorted by EventTime LIMIT N
  // 7. Update Function Status to "stopped" state when no more ProcessCreate to link
  
  // step 0 - don't run if it has already started
  var r = db.query('SELECT count(1) FROM FunctionStatus WHERE name = "ProcessImageLoad" AND status = "running"');
  if(r.length > 0) {
    print('ProcessImageLoad still running...')
      return
  }
  
  // step 1 - find the earliest record time
  r = db.query('SELECT EventTime FROM ImageLoad WHERE ToBeProcessed = true Order By EventTime ASC LIMIT ?', N);
  if(r.length == 0) { // step 2
    //print(Date() + ' ProcessImageLoad nothing to do')
      return 
  }
  var startTime = r[0].getProperty('EventTime')
  
  // step 3 - start running state
  db.command('UPDATE FunctionStatus SET status = "running" WHERE name = "ProcessImageLoad"')
  //print(Date() + ' changed ProcessImageLoad status to running...')
  
  // step 4a for ProcessCreate
  r = db.query('SELECT @rid, ProcessGuid, Hostname FROM processcreate \
          WHERE ProcessGuid in (SELECT ProcessGuid FROM ImageLoad \
          WHERE ToBeProcessed = true AND EventTime >= ? ORDER BY EventTime limit ?)', startTime, N)
  if(r.length > 0){   
      // step 5a - bulk edge creation
      for(var i=0; i < r.length; i++){
          print(Date() + ' Creating LoadedImage edges for ' + r[i].getProperty('ProcessGuid') )
          db.command('CREATE EDGE LoadedImage FROM ? TO (SELECT FROM ImageLoad \
                      WHERE ToBeProcessed = true AND EventTime >= ? AND Hostname = ? \
                      AND ProcessGuid = ? ORDER BY EventTime LIMIT ?)',
                      r[i].getProperty('@rid'), startTime, 
                      r[i].getProperty('Hostname'), r[i].getProperty('ProcessGuid'), N)
      }
  }
  // step 4b for FileCreate 
  r = db.query('SELECT @rid, ProcessGuid, Hostname FROM FileCreate \
                WHERE TargetFilename.toLowerCase() in (SELECT ImageLoaded.toLowerCase() FROM ImageLoad \
                WHERE ToBeProcessed = true AND EventTime >= ? ORDER BY EventTime LIMIT ?)', startTime, N)
  if(r.length > 0){ 
      // step 5b - bulk edge creation
      for(var i=0; i < r.length; i++){
        print(Date() + ' Creating edges for ' + r[i].getProperty('ProcessGuid') )
          db.command('CREATE EDGE LoadedImage FROM ? TO (SELECT FROM ImageLoad \
                      WHERE ToBeProcessed = true AND EventTime >= ? AND Hostname = ? \
                      AND ProcessGuid = ? ORDER BY EventTime LIMIT ?)',
                      r[i].getProperty('@rid'), startTime, 
                      r[i].getProperty('Hostname'), r[i].getProperty('ProcessGuid'), N)
      }
  }

  // step 6 - update ToBeProcessed N rows starting from startTime
  db.command('UPDATE ImageLoad SET ToBeProcessed = false \
        WHERE ToBeProcessed = true AND EventTime >= ? LIMIT ?',startTime, N)
  
  // step 7 - update function status
  db.command('UPDATE FunctionStatus SET status = "stopped" WHERE name = "ProcessImageLoad"')
  //print(Date() + ' changed ProcessImageLoad status to stopped...')
  
  return r