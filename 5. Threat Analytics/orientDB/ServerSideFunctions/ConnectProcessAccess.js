  /**
   * 1. Use ODB WebStudio Function Management
   * 2. Create a function ConnectProcessAccess with NO parameters
   * 3. Paste the codes below into the FM's editor & save  
   */
  var db = orient.getDatabase();
  var N = 1000 // limit the number of records to process
  
  // 0. Check Function Status table, if running, quit
  // 1. Get first (sorted by id) 1st row ToBeProcessed (assign to startTime)
  // 2. If no result, quit 
  // 3. Update Function Status to "running" state
  // 4. Select ProcessCreate RID, Hostname & ProcessGuid matching first N ProcessAccess rows sorted by id <= startTime
  // 5. Foreach rid & ProcessGuid, create edges from ProcessCreate RID to (ProcessAccess with matching Hostname, ProcessGuid and id <= startTime sorted by id LIMIT N)
  // 6. Update ToBeProcessed = false for N rows starting from startTime, avoid repeated processing
  // 7. Update Function Status to "stopped" state when no more ProcessCreate to link
  
  // step 0 - don't run if it has already started
  var r = db.query('SELECT count(1) FROM FunctionStatus WHERE name = "ConnectProcessAccess" AND status = "running"');
  if(r.length > 0) {
      print('ConnectProcessAccess still running...')
      return
  }
  
  // step 1 - find the earliest record time
  r = db.query('SELECT id, SourceProcessGUID, TargetProcessGUID FROM ProcessAccess WHERE ToBeProcessed = true Order By id ASC LIMIT ?', N);
  if(r.length == 0) { // step 2
      return 
  }
  var endID = r[r.length - 1].getProperty('id') //time of earliest ToBeProcessed event
  
  var source_guids2find = 'ProcessGuid = "'
  var target_guids2find = 'ProcessGuid = "'
  for(var i=0; i < r.length; i++){
      if(source_guids2find.indexOf(r[i].getProperty('SourceProcessGUID')) < 0)
            source_guids2find += r[i].getProperty('SourceProcessGUID') + '" OR ProcessGuid = "' 
      if(target_guids2find.indexOf(r[i].getProperty('TargetProcessGUID')) < 0)
            target_guids2find += r[i].getProperty('TargetProcessGUID') + '" OR ProcessGuid = "' 

  }
  source_guids2find = source_guids2find.slice(0,-18) // get rid of the last " OR ProcessGuid = "
  target_guids2find = target_guids2find.slice(0,-18) // get rid of the last " OR ProcessGuid = "
  print(target_guids2find)
  // step 3 - start running state
  db.command('UPDATE FunctionStatus SET status = "running" WHERE name = "ConnectProcessAccess"')
  
  // step 4a - find those ProcessCreate in SourceProcessGUID
  r = db.query('SELECT SourceProcessGUID, Hostname FROM ProcessAccess \
                WHERE ToBeProcessed = true AND id <= ? AND SourceProcessGUID in \
               (SELECT ProcessGuid FROM ProcessCreate WHERE ' + source_guids2find + ') GROUP BY SourceProcessGUID ORDER BY id LIMIT ?', endID, N)
  if(r.length > 0){ // ProcessCreate-[ProcessAccessedFrom:L.ProcessGuid = R.SourceProcessGUID]->ProcessAccess
      var prev_guids = []
      for(var i=0; i < r.length; i++){  // step 5a - bulk edge creation
          if(prev_guids.indexOf(r[i].getProperty('SourceProcessGUID')) < 0 ) {
                print(Date() + ' Creating ProcessAccessedFrom edges for ' + r[i].getProperty('SourceProcessGUID') )
                try{
                    db.command('CREATE EDGE ProcessAccessedFrom FROM (SELECT FROM ProcessCreate WHERE Hostname = ? AND \
                        ProcessGuid = ?) TO (SELECT FROM ProcessAccess WHERE ToBeProcessed = true AND id <= ? \
                        AND Hostname = ? AND SourceProcessGUID = ? AND in().size() = 0 ORDER BY id LIMIT ?)',
                        r[i].getProperty('Hostname'), r[i].getProperty('SourceProcessGUID'), endID, 
                        r[i].getProperty('Hostname'), r[i].getProperty('SourceProcessGUID'), N)
                }
                catch(err){

                }
          }
          prev_guids.push(r[i].getProperty('SourceProcessGUID'))
        }
  }
  
// step 4b - find those ProcessCreate in TargetProcessGUID
  r = db.query('SELECT TargetProcessGUID, Hostname FROM ProcessAccess \
                WHERE ToBeProcessed = true AND id <= ? AND TargetProcessGUID in \
               (SELECT ProcessGuid FROM ProcessCreate WHERE '+ target_guids2find +') GROUP BY TargetProcessGUID ORDER BY id LIMIT ?', endID, N)
  if(r.length > 0){ // ProcessAccess-[ProcessAccessedTo:L.TargetProcessGUID = R.ProcessGuid]->ProcessCreate
    var prev_guids = [] 
      for(var i=0; i < r.length; i++){ // step 5b - bulk edge creation 
        if(prev_guids.indexOf(r[i].getProperty('TargetProcessGUID')) < 0 ) {
            print(Date() + ' Creating ProcessAccessedTo edges for ' + r[i].getProperty('TargetProcessGUID') )
            try {
                db.command('CREATE EDGE ProcessAccessedTo FROM (SELECT FROM ProcessAccess \
                    WHERE ToBeProcessed = true AND id <= ? AND Hostname = ? \
                    AND TargetProcessGUID = ? AND out().size() = 0 ORDER BY id LIMIT ?) TO \
                    (SELECT FROM ProcessCreate WHERE Hostname = ? AND ProcessGuid = ?)', 
                    endID, r[i].getProperty('Hostname'), r[i].getProperty('TargetProcessGUID'),
                    N, r[i].getProperty('Hostname'), r[i].getProperty('TargetProcessGUID'))
            }
            catch(err){

            }
        }
        prev_guids.push(r[i].getProperty('TargetProcessGUID'))
      }
  }
  // step 6 - update ToBeProcessed N rows starting from startTime
  db.command('UPDATE ProcessAccess SET ToBeProcessed = false \
              WHERE ToBeProcessed = true AND id <= ? LIMIT ?',endID, N)
  
  // step 7 - update function status
  db.command('UPDATE FunctionStatus SET status = "stopped" WHERE name = "ConnectProcessAccess"')
  //print(Date() + ' changed ConnectProcessAccess status to stopped...')
  
  return r