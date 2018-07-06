  /**
   * 1. Use ODB WebStudio Function Management
   * 2. Create a function ConnectImageLoad with NO parameters
   * 3. Paste the codes below into the FM's editor & save  
   */
  var db = orient.getDatabase();
  var N = 1000 // limit the number of records to process
  
  // 0. Check Function Status table, if running, quit
  // 1. Get 1st row's id (startID) ordered by id ascending
  // 2. If no result, quit 
  // 3. Update Function Status to "running" state
  // 4. Select ProcessCreate RID, Hostname & ProcessGuid matching first N ImageLoad rows sorted by id <= startTime
  // 5. Foreach rid & ProcessGuid, create edges from ProcessCreate RID to (ImageLoad with matching Hostname, ProcessGuid and id <= startTime sorted by id LIMIT N)
  // 6. Update ToBeProcessed = false where id <= startTime sorted by id LIMIT N
  // 7. Update Function Status to "stopped" state when no more ProcessCreate to link
  
  // step 0 - don't run if it has already started
  var r = db.query('SELECT count(1) FROM FunctionStatus WHERE name = "ConnectImageLoad" AND status = "running"');
  if(r.length > 0) {
    print('ConnectImageLoad still running...')
      return
  }
  
  // step 1 - find the earliest record time
  r = db.query('SELECT id FROM ImageLoad WHERE ToBeProcessed = true Order By id ASC LIMIT ?', N);
  if(r.length == 0) { // step 2
    //print(Date() + ' ConnectImageLoad nothing to do')
      return 
  }
  var startID = r[r.length - 1].getProperty('id')
  
  // step 3 - start running state
  db.command('UPDATE FunctionStatus SET status = "running" WHERE name = "ConnectImageLoad"')
  //print(Date() + ' changed ConnectImageLoad status to running...')
  
  // step 4a for ProcessCreate
  r = db.query('SELECT @rid, ProcessGuid, Hostname FROM processcreate \
          WHERE ProcessGuid in (SELECT ProcessGuid FROM ImageLoad \
          WHERE ToBeProcessed = true AND id <= ? ORDER BY id limit ?)', startID, N)
  if(r.length > 0){   
      // step 5a - bulk edge creation
      for(var i=0; i < r.length; i++){
          //print(Date() + ' Creating LoadedImage edges for ' + r[i].getProperty('ProcessGuid') )
          db.command('CREATE EDGE LoadedImage FROM ? TO (SELECT FROM ImageLoad \
                      WHERE ToBeProcessed = true AND id <= ? AND Hostname = ? \
                      AND ProcessGuid = ? ORDER BY id LIMIT ?)',
                      r[i].getProperty('@rid'), startID, 
                      r[i].getProperty('Hostname'), r[i].getProperty('ProcessGuid'), N)
      }
  }
  // step 4b for FileCreate 
  r = db.query('SELECT @rid, TargetFilename, Hostname FROM FileCreate \
                WHERE TargetFilename.toLowerCase() in (SELECT ImageLoaded.toLowerCase() FROM ImageLoad \
                WHERE ToBeProcessed = true AND id <= ? ORDER BY id LIMIT ?)', startID, N)
  if(r.length > 0){ 
      // step 5b - bulk edge creation
      for(var i=0; i < r.length; i++){
          var filePath = '' + r[i].getProperty('TargetFilename')
          print(Date() + ' Creating UsedAsImage edges for ' + r[i].getProperty('TargetFilename') )
          db.command('CREATE EDGE UsedAsImage FROM ? TO (SELECT FROM ImageLoad \
                      WHERE ToBeProcessed = true AND id <= ? AND Hostname = ? \
                      AND ImageLoaded.toLowerCase() = ? ORDER BY id LIMIT ?)',
                      r[i].getProperty('@rid'), startID, r[i].getProperty('Hostname'), 
                      filePath.toLowerCase(), N)
      }
  }

  // step 6 - update ToBeProcessed N rows starting from startTime
  db.command('UPDATE ImageLoad SET ToBeProcessed = false \
        WHERE ToBeProcessed = true AND id <= ? LIMIT ?',startID, N)
  
  // step 7 - update function status
  db.command('UPDATE FunctionStatus SET status = "stopped" WHERE name = "ConnectImageLoad"')
  //print(Date() + ' changed ConnectImageLoad status to stopped...')
  
  return r