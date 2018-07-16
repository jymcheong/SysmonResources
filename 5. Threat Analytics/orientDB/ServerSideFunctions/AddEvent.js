  /**
   * 1. Use ODB WebStudio Function Management
   * 2. Create a function AddEvent with two parameters: classname, jsondata
   * 3. Paste the codes below into the FM's editor & save  
   */
  var db = orient.getDatabase();
  
  // edge class look up table to minimize repeated queries; vertex-class to edge-class
  var edgeLookup = {'ProcessTerminate':'Terminated', 'PipeCreated':'CreatedPipe',
                    'PipeConnected':'ConnectedPipe', 'RawAccessRead':'RawRead',
                    'FileCreateTime':'ChangedFileCreateTime', 'FileCreate':'CreatedFile',
                    'FileCreateStreamHash':'CreatedFileStream', 'RegistryEvent':'AccessedRegistry',
                    'NetworkConnect':'ConnectedTo', 'ImageLoad':'LoadedImage'}
  
  var eventIdLookup = {1:'ProcessCreate', 2:'FileCreateTime', 3:'NetworkConnect', 
                        4:'SysmonStatus', 5:'ProcessTerminate',6:'DriverLoad', 
                        7:'ImageLoad', 8:'CreateRemoteThread', 9:'RawAccessRead', 
                        10:'ProcessAccess', 11:'FileCreate', 12:'RegistryEvent', 
                        13:'RegistryEvent', 14:'RegistryEvent', 15:'FileCreateStreamHash', 
                        16:'ConfigChanged', 17:'PipeCreated', 18:'PipeConnected', 
                        19:'WmiEvent', 20:'WmiEvent', 21:'WmiEvent', 255:'Error' }
  
  // fix issue #104 - illegal field names
  function rewriteProperties(obj) {
    var notValid = /[\W_]+/g
    if (typeof obj !== "object") return obj; //that is not a typo, it checks value & type
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            obj[prop.replace(notValid, "")] = rewriteProperties(obj[prop]);
            if (notValid.test(prop)) {
                delete obj[prop];
            }
        }
    }
    return obj;
  }                       
  
  var logline = unescape(jsondata)
  var e = rewriteProperties(JSON.parse(logline)); 
  
  e['ToBeProcessed'] = true
  classname = 'WinEvent'
  
  if(e['Keywords'] != undefined) {
  	e['Keywords'] = '' + e['Keywords']
  }

  // Sysmon events
  if(e["SourceName"] == "Microsoft-Windows-Sysmon"){
      classname = eventIdLookup[e['EventID']]
      e['SysmonProcessId'] = e['ProcessID']
      delete e['ProcessID']
      var re = /ProcessId: (\d+)/g
      var match = re.exec(logline)
      if(match != null)
          e['ProcessId'] = parseInt(match[1])        
  }

  // DataFusion UAT events
  if(e["SourceName"] == "DataFuseUserActions"){
      classname = 'UserActionTracking'
      delete e['ProcessID']
      uat = JSON.parse(e['Message'])
      for(var k in uat){
          e[k] = uat[k]
      }
  }

  // DataFusion network events
  if(e["SourceName"] == "DataFuseNetwork"){
      classname = 'NetworkDetails'
      delete e['ProcessID']
      uat = JSON.parse(e['Message'])
      for(var k in uat){
          e[k] = uat[k]
      }
  }   

  delete e['Message'] //problematic for server-side parsing... it is repeated data anyway
  
  var jsonstring = JSON.stringify(e)
  //work around the inconsistent behavior of INSERT .. CONTENT
  if(classname == 'ImageLoad') jsonstring = jsonstring.slice(0,-1) + ",\"id\":sequence('ImageLoad_idseq').next()}"
  if(classname == 'ProcessAccess') jsonstring = jsonstring.slice(0,-1) + ",\"id\":sequence('ProcessAccess_idseq').next()}"    
  var stmt = 'INSERT INTO '+ classname + ' CONTENT ' + jsonstring
  var r = db.command(stmt);
  
  switch(classname) {

      // ProcessCreate-[ParentOf:ParentProcessGuid,Hostname]->ProcessCreate
    case "ProcessCreate": // ID 1
          stmt = 'CREATE EDGE ParentOf FROM \
                  (SELECT FROM ProcessCreate WHERE ProcessGuid = ? AND Hostname = ? LIMIT 1) TO ?'
          try{
              db.command(stmt,e['ParentProcessGuid'], e['Hostname'],r[0].getProperty('@rid'))
          }
          catch(err){
              //print(err)
          }
          break;

  // the following classes are linked to ProcessCreate via ProcessGuid + Hostname index
    case "ProcessTerminate"://ID5: ProcessCreate-[Terminated]->ProcessTerminate     	
    case "PipeCreated":	    //ID17: ProcessCreate-[CreatedPipe]->PipeCreated	
    case "PipeConnected":   //ID18: ProcessCreate-[ConnectedPipe]->PipeConnected
    case "RawAccessRead":   //ID9: ProcessCreate-[RawRead]->RawAccessRead
    case "FileCreateTime":  //ID2: ProcessCreate-[ChangedFileCreateTime]->FileCreateTime	
    case "FileCreate": 	    //ID11: ProcessCreate-[CreatedFile]->FileCreate 
    case "FileCreateStreamHash": //ID15: ProcessCreate-[CreatedFileStream]->FileCreateStreamHash    
    case "RegistryEvent":   //ID13&14: ProcessCreate-[AccessedRegistry]->RegistryEvent
    case "NetworkConnect":  //ID3: ProcessCreate-[ConnectedTo]->NetworkConnect 

          // generalized query for above classes linking to ProcessCreate class
          stmt = 'CREATE EDGE ' + edgeLookup[classname] + 
                 ' FROM (SELECT FROM ProcessCreate WHERE ProcessGuid = ? AND Hostname = ? LIMIT 1) TO ?'
          try{
              db.command(stmt,e['ProcessGuid'],e['Hostname'],r[0].getProperty('@rid'))
          }
          catch(err){
            //print(err)
          }        
          break;

    case "DriverLoad": //ID6
          // FileCreate-[UsedAsDriver:TargetFilename=ImageLoaded]->DriverLoad
          stmt = 'CREATE EDGE UsedAsDriver FROM \
                  (SELECT FROM FileCreate WHERE Hostname = ? AND TargetFilename.toLowerCase() = ?) TO ?'
          try{
              db.command(stmt,e['Hostname'],e['ImageLoaded'].toLowerCase() ,r[0].getProperty('@rid'))
          }
          catch(err){
            //print(err)
          }
          break;


    case "CreateRemoteThread": //ID8
          // ProcessCreate-[CreatedThread:SourceProcessGuid]->CreateRemoteThread
          stmt = 'CREATE EDGE CreatedThread FROM \
                  (SELECT FROM ProcessCreate WHERE Hostname = ? AND ProcessGuid = ? LIMIT 1) TO ?'
          try{
             db.command(stmt,e['Hostname'],e['SourceProcessGuid'],r[0].getProperty('@rid'))
          }
          catch(err){
            //print(err)
          }
          // CreateRemoteThread-[RemoteThreadFor:TargetProcessId]->ProcessCreate
          stmt = 'CREATE EDGE RemoteThreadFor FROM ? TO \
                  (SELECT FROM ProcessCreate WHERE Hostname = ? AND ProcessId = ? Order By EventTime Desc LIMIT 1)'
          try{
             db.command(stmt,r[0].getProperty('@rid'),e['Hostname'],e['TargetProcessId'])
          }
          catch(err){
            //print(err)
          }
          break;

    case 'UserActionTracking':
          //  Linked to ProcessId except Foreground Transition which has FromProcessId & ToProcessId
          if(e['Action']=='Foreground Transition'){
              stmt = 'CREATE EDGE SwitchedFrom FROM \
                      (SELECT FROM ProcessCreate WHERE Hostname = ? AND ProcessId = ?  \
                       Order By EventTime Desc LIMIT 1) TO ?'
              try{
                db.command(stmt,e['Hostname'],e['FromProcessId'],r[0].getProperty('@rid'))
              }
              catch(err){
                //print(err)
              }
              stmt = 'CREATE EDGE SwitchedTo FROM ? TO \
                      (SELECT FROM ProcessCreate WHERE Hostname = ? AND \
                      ProcessId = ? Order By EventTime Desc LIMIT 1)'
              try{
                db.command(stmt,r[0].getProperty('@rid'),e['Hostname'],e['ToProcessId'])
              }
              catch(err){
                //print(err)
              }
          }
          else { // other UAT actions
            stmt = 'CREATE EDGE ActedOn FROM ? TO \
                      (SELECT FROM ProcessCreate WHERE Hostname = ? AND ProcessId = ? \
                      Order By EventTime Desc LIMIT 1)'
            try{
              db.command(stmt,r[0].getProperty('@rid'),e['Hostname'],e['ProcessId'])
            }
            catch(err){
              //print(err)
            }
          }
          break;

      // ProcessCreate-[LoadedImage:ProcessGuid,Hostname]->ImageLoad
      // FileCreate-[UsedAsImage:TargetFilename=ImageLoaded]->ImageLoad
    //case "ImageLoad": // ID7 for bulk process function    
          // why not use default value? I had problems expand JSON into name=value pairs. filepath names \\ cause problems
          //stmt = 'UPDATE ImageLoad SET id = sequence("ImageLoad_idseq").next() WHERE @rid = ?'
          //db.command(stmt,r[0].getProperty('@rid'))
         // break;

      // ProcessCreate-[ProcessAccessed:L.ProcessGuid = R.SourceProcessGUID]->ProcessAccess
      // ProcessAccess-[ProcessAccessedFrom:L.TargetProcessGUID = R.ProcessGuid]->ProcessCreate
    //case "ProcessAccess": // ID 10 for bulk process function
          //stmt = 'UPDATE ProcessAccess SET id = sequence("ProcessAccess_idseq").next() WHERE @rid = ?'
          //db.command(stmt,r[0].getProperty('@rid'))      
          //break;
  }

  //Classes that may have 2nd edge
  switch(classname) {
    case "NetworkConnect":// NetworkConnect-[ConnectedTo:(L.Hostname = R.SourceHostname) & L.Hostname != R.Hostname]->NetworkConnect
          //TODO
      	  break;

    case "RegistryEvent":// FileCreateStreamHash-[FoundWithin:TargetFilename in Details]->RegistryEvent
          //TODO
          break;

    case "FileCreateStreamHash":// FileCreateStreamHash-[FoundWithin:TargetFilename in Details]->RegistryEvent
          //TODO
          break;
  }

  // Bulk processing for ProcessAccess & ImageLoad
  if(classname != "ProcessAccess" && classname != "ImageLoad"){
      db.command('update '+ classname +' set ToBeProcessed = false where @rid = ?',r[0].getProperty('@rid'))
  }
  return r
  


 