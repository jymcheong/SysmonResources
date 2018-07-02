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

  var e = JSON.parse(jsondata); 
  var r = db.command('insert into '+ classname + ' content ' + jsondata);
  var stmt = ''

  switch(classname) {

      // ProcessCreate-[ParentOf:ParentProcessGuid,Hostname]->ProcessCreate
    case "ProcessCreate": // ID 1
          stmt = 'CREATE EDGE ParentOf FROM \
                  (SELECT FROM ProcessCreate WHERE ProcessGuid = ? AND Hostname = ?) TO ?'
          try{
              db.command(stmt,e['ParentProcessGuid'], e['Hostname'],r[0].getProperty('@rid'))
          }
          catch(err){
              print(err)
          }
          break;

  // the following classes are linked to ProcessCreate via ProcessGuid + Hostname index
    case "ProcessTerminate"://ID5: ProcessCreate-[Terminated]->ProcessTerminate     	
    case "PipeCreated":	  //ID17: ProcessCreate-[CreatedPipe]->PipeCreated	
    case "PipeConnected":   //ID18: ProcessCreate-[ConnectedPipe]->PipeConnected
    case "RawAccessRead":   //ID9: ProcessCreate-[RawRead]->RawAccessRead
    case "FileCreateTime":  //ID2: ProcessCreate-[ChangedFileCreateTime]->FileCreateTime	
    case "FileCreate": 	  //ID11: ProcessCreate-[CreatedFile]->FileCreate 
    case "FileCreateStreamHash": //ID15: ProcessCreate-[CreatedFileStream]->FileCreateStreamHash    
    case "RegistryEvent": //ID13&14: ProcessCreate-[AccessedRegistry]->RegistryEvent
    case "NetworkConnect"://ID3: ProcessCreate-[ConnectedTo]->NetworkConnect 
    case "ImageLoad": //ID7: ProcessCreate-[LoadedImage]->ImageLoad

          // generalized query for above classes linking to ProcessCreate class
          stmt = 'CREATE EDGE ' + edgeLookup[classname] + 
                 ' FROM (SELECT FROM ProcessCreate WHERE ProcessGuid = ? AND Hostname = ?) TO ?'
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
                  (SELECT FROM ProcessCreate WHERE Hostname = ? AND ProcessGuid = ?) TO ?'
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
            stmt = 'CREATE EDGE ActedOn FROM ? TO \
                  (SELECT FROM ProcessCreate WHERE Hostname = ? AND (ProcessId = ? OR ProcessId = ?) Order By EventTime Desc LIMIT 2)'
            try{
              db.command(stmt,r[0].getProperty('@rid'),e['Hostname'],e['FromProcessId'],e['ToProcessId'])
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
  //  case "ImageLoad": // ID7 for bulk process function    

      // ProcessCreate-[ProcessAccessed:L.ProcessGuid = R.SourceProcessGUID]->ProcessAccess
      // ProcessAccess-[ProcessAccessedFrom:L.TargetProcessGUID = R.ProcessGuid]->ProcessCreate
  //  case "ProcessAccess": // ID 10 for bulk process function


  }

  //Class with 2nd edge
  switch(classname) {
    case "NetworkConnect":// NetworkConnect-[ConnectedTo:(L.Hostname = R.SourceHostname) & L.Hostname != R.Hostname]->NetworkConnect
          break;

    case "RegistryEvent":// FileCreateStreamHash-[FoundWithin:TargetFilename in Details]->RegistryEvent
          break;

    case "FileCreateStreamHash":// FileCreateStreamHash-[FoundWithin:TargetFilename in Details]->RegistryEvent
          break;
  }

  // Bulk processing for ProcessAccess (& maybe ImageLoad)
  if(classname != "ProcessAccess"){
      db.command('update '+ classname +' set ToBeProcessed = false where @rid = ?',r[0].getProperty('@rid'))
  }

  return r

