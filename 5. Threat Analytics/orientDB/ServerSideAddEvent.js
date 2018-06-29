/**
 * 1. Use ODB WebStudio Function Management
 * 2. Create a function AddEvent with two parameters: classname, jsondata
 * 3. Paste the codes below into the FM's editor & save  
 */
var db = orient.getDatabase();

//need to do this since it won't return the record
var e = JSON.parse(jsondata); 
print(e["ProcessGuid"]) // need this to find ProcessCreate eg. ProcessGuid

// Insert cannot use parameters. RETURN @this will crash the whole system
var r = db.command('insert into '+ classname + ' content ' + jsondata);

switch(classname) {
// ProcessCreate-[ParentOf:ProcessGuid,Hostname]->ProcessCreate
  case "ProcessCreate":
    
// ProcessCreate-[CreatedRemoteThread:SourceProcessGuid]->CreateRemoteThread
// CreateRemoteThread-[RemoteThreadFor:TargetProcessId]->ProcessCreate
  case "CreateRemoteThread":
    
// ProcessCreate-[WroteFile:ProcessGuid,Hostname]->FileCreate
// FileCreate-[UsedAsDriver:TargetFilename=ImageLoaded]->DriverLoad
  case "FileCreate":

// ProcessCreate-[LoadedImage:ProcessGuid,Hostname]->ImageLoad
// FileCreate-[UsedAsImage:TargetFilename=ImageLoaded]->ImageLoad
  case "ImageLoad": // implemented as bulk process function later
    
// ProcessCreate-[AccessedRegistry:ProcessGuid,Hostname]->RegistryEvent
// FileCreateStreamHash-[FoundWithin:TargetFilename in Details]->RegistryEvent
// this assumes ADS created first before the registry event; the reverse can happen too
  case "RegistryEvent":

// ProcessCreate-[CreatedFileStream:ProcessGuid,Hostname]->FileCreateStreamHash   
// FileCreateStreamHash-[FoundWithin:TargetFilename in Details]->RegistryEvent
  case "FileCreateStreamHash":    
    
// ProcessCreate-[Terminated:ProcessGuid,Hostname]->ProcessTerminate
  case "ProcessTerminate":      

// ProcessCreate-[ConnectedTo:ProcessGuid,Hostname]->NetworkConnect
// If destination IP/host is also in the population, will there be a NetworkConnect of the other host?
// anyway to look at it, is there a NetworkConnect where Source IP is from another machine?
// NetworkConnect-[ConnectedTo:(L.Hostname = R.SourceHostname) & L.Hostname != R.Hostname]->NetworkConnect  <- need to consider time window
  case "NetworkConnect": 

// ProcessCreate-[CreatedPipe:ProcessGuid,Hostname]->PipeCreated
  case "PipeCreated":

// ProcessCreate-[ConnectedPipe:ProcessGuid,Hostname]->PipeConnected
  case "PipeConnected":

// ProcessCreate-[ProcessAccessed:L.ProcessGuid = R.SourceProcessGUID]->ProcessAccess
// ProcessAccess-[ProcessAccessedFrom:L.TargetProcessGUID = R.ProcessGuid]->ProcessCreate
// another bulk processing function for this    
  case "ProcessAccess":
    
// ProcessCreate-[RawRead:ProcessGuid,Hostname]->RawAccessRead
  case "RawAccessRead":

// ProcessCreate-[ChangedFileCreateTime:ProcessGuid,Hostname]->FileCreateTime
  case "FileCreateTime":
    
    
    print(classname)
}

return r 