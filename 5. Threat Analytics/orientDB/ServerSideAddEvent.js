/**
 * 1. Use ODB WebStudio Function Management
 * 2. Create a function AddEvent with two parameters: classname, jsondata
 * 3. Paste the codes below into the FM's editor & save  
 */
var db = orient.getDatabase();

// edge class look up table
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
  case "ProcessCreate":
    	stmt = 'CREATE EDGE ParentOf FROM (SELECT FROM ProcessCreate WHERE ProcessGuid = ? AND Hostname = ?) TO ?'
        try{
    		db.command(stmt,e['ParentProcessGuid'], e['Hostname'],r[0].getProperty('@rid'))
        }
    	catch(err){
        	print('parent process not found')
        }
    	break;

    // ProcessCreate-[Terminated:ProcessGuid,Hostname]->ProcessTerminate
  case "ProcessTerminate":      	
    // ProcessCreate-[CreatedPipe:ProcessGuid,Hostname]->PipeCreated
  case "PipeCreated":	
    // ProcessCreate-[ConnectedPipe:ProcessGuid,Hostname]->PipeConnected
  case "PipeConnected":
    // ProcessCreate-[RawRead:ProcessGuid,Hostname]->RawAccessRead
  case "RawAccessRead":
	// ProcessCreate-[ChangedFileCreateTime:ProcessGuid,Hostname]->FileCreateTime
  case "FileCreateTime":		
    // ProcessCreate-[CreatedFile:ProcessGuid,Hostname]->FileCreate
  case "FileCreate":
	// ProcessCreate-[CreatedFileStream:ProcessGuid,Hostname]->FileCreateStreamHash   
  case "FileCreateStreamHash":    
    // ProcessCreate-[AccessedRegistry:ProcessGuid,Hostname]->RegistryEvent
  case "RegistryEvent":
    // ProcessCreate-[ConnectedTo:ProcessGuid,Hostname]->NetworkConnect
  case "NetworkConnect": 
	// ProcessCreate-[LoadedImage:ProcessGuid,Hostname]->ImageLoad    
   case "ImageLoad":
    	stmt = 'CREATE EDGE ? FROM (SELECT @rid FROM ProcessCreate WHERE ProcessGuid = ? AND Hostname = ?) TO ?'
    	try{
          db.command(stmt,edgeLookup[classname],e['ProcessGuid'],e['Hostname'],r[0].getProperty('@rid'))
        }
    	catch(err){
        }
		break;
    
    // FileCreate-[UsedAsDriver:TargetFilename=ImageLoaded]->DriverLoad
  case "DriverLoad":
    	break;

    // ProcessCreate-[CreatedRemoteThread:SourceProcessGuid]->CreateRemoteThread
    // CreateRemoteThread-[RemoteThreadFor:TargetProcessId]->ProcessCreate
  case "CreateRemoteThread":
    	break;
    
    // ProcessCreate-[LoadedImage:ProcessGuid,Hostname]->ImageLoad
    // FileCreate-[UsedAsImage:TargetFilename=ImageLoaded]->ImageLoad
//  case "ImageLoad": // for bulk process function    
    
	// ProcessCreate-[ProcessAccessed:L.ProcessGuid = R.SourceProcessGUID]->ProcessAccess
	// ProcessAccess-[ProcessAccessedFrom:L.TargetProcessGUID = R.ProcessGuid]->ProcessCreate
//  case "ProcessAccess": // for bulk process function

//	case 'UserActionTracking':    
}

print(classname)
    
//process classes with 2nd possible edge
if(classname == "NetworkConnect"){
// NetworkConnect-[ConnectedTo:(L.Hostname = R.SourceHostname) & L.Hostname != R.Hostname]->NetworkConnect
}
    
if(classname == "RegistryEvent"){
// FileCreateStreamHash-[FoundWithin:TargetFilename in Details]->RegistryEvent
}
    
if(classname == "FileCreateStreamHash"){
// FileCreateStreamHash-[FoundWithin:TargetFilename in Details]->RegistryEvent
}

//return r 