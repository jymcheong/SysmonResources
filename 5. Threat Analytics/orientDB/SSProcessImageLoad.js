  /**
   * 1. Use ODB WebStudio Function Management
   * 2. Create a function ProcessImageLoad with NO parameters
   * 3. Paste the codes below into the FM's editor & save  
   */
  var db = orient.getDatabase();

// 0. Check Function Status table, if running, quit
// 1. Get 1st row's EventTime (startTime) ordered by EventTime ascending
// 2. If no result, quit since nothing to do
// 3. Update Function Status to "running" state
// 4. Select ProcessCreate RID, Hostname & ProcessGuid matching first N ImageLoad rows sorted by EventTime >= startTime
// 5. Foreach rid & ProcessGuid, create edges from ProcessCreate RID to (ImageLoad with matching Hostname, ProcessGuid and EventTime >= startTime sorted by EventTime LIMIT N)
// 6. Update ToBeProcessed = false where EventTime >= startTime LIMIT N
// 7. Update Function Status to "stopped" state