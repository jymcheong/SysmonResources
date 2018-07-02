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
    	stmt = 'CREATE EDGE ParentOf FROM (SELECT FROM ProcessCreate WHERE ProcessGuid = ? AND Hostname = ?) TO ?'
        try{
    		db.command(stmt,e['ParentProcessGuid'], e['Hostname'],r[0].getProperty('@rid'))
        }
    	catch(err){
        	print('parent process not found')
        }
    	break;

    // ProcessCreate-[Terminated:ProcessGuid,Hostname]->ProcessTerminate
  case "ProcessTerminate": // ID 5     	
    // ProcessCreate-[CreatedPipe:ProcessGuid,Hostname]->PipeCreated
  case "PipeCreated": // ID 17	
    // ProcessCreate-[ConnectedPipe:ProcessGuid,Hostname]->PipeConnected
  case "PipeConnected": // ID 18
    // ProcessCreate-[RawRead:ProcessGuid,Hostname]->RawAccessRead
  case "RawAccessRead": // ID 9
	// ProcessCreate-[ChangedFileCreateTime:ProcessGuid,Hostname]->FileCreateTime
  case "FileCreateTime": // ID 2		
    // ProcessCreate-[CreatedFile:ProcessGuid,Hostname]->FileCreate
  case "FileCreate": // ID 11
	// ProcessCreate-[CreatedFileStream:ProcessGuid,Hostname]->FileCreateStreamHash   
  case "FileCreateStreamHash": // ID 15    
    // ProcessCreate-[AccessedRegistry:ProcessGuid,Hostname]->RegistryEvent
  case "RegistryEvent": // ID 13 & 14
    // ProcessCreate-[ConnectedTo:ProcessGuid,Hostname]->NetworkConnect
  case "NetworkConnect": // ID 3
	// ProcessCreate-[LoadedImage:ProcessGuid,Hostname]->ImageLoad    
  case "ImageLoad": // ID 7
    
    	// generalized query for various classes linking to ProcessCreate class
    	stmt = 'CREATE EDGE ' + edgeLookup[classname] + 
               ' FROM (SELECT FROM ProcessCreate WHERE ProcessGuid = ? AND Hostname = ?) TO ?'
    	try{
          db.command(stmt,e['ProcessGuid'],e['Hostname'],r[0].getProperty('@rid'))
        }
    	catch(err){
          print(err)
        }
		break;
    
    // FileCreate-[UsedAsDriver:TargetFilename=ImageLoaded]->DriverLoad
  case "DriverLoad": // ID 6
    	break;

    // ProcessCreate-[CreatedRemoteThread:SourceProcessGuid]->CreateRemoteThread
    // CreateRemoteThread-[RemoteThreadFor:TargetProcessId]->ProcessCreate
  case "CreateRemoteThread": // ID 8
    	break;
    
    // ProcessCreate-[LoadedImage:ProcessGuid,Hostname]->ImageLoad
    // FileCreate-[UsedAsImage:TargetFilename=ImageLoaded]->ImageLoad
//  case "ImageLoad": // ID7 for bulk process function    
    
	// ProcessCreate-[ProcessAccessed:L.ProcessGuid = R.SourceProcessGUID]->ProcessAccess
	// ProcessAccess-[ProcessAccessedFrom:L.TargetProcessGUID = R.ProcessGuid]->ProcessCreate
//  case "ProcessAccess": // ID 10 for bulk process function

//	case 'UserActionTracking':    
}

print(classname)
    
//classes inside edgeLookUp table with 2nd possible edge
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