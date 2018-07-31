$ODBhost =$args[0]
# Use admin CMD console & type:  powershell -ExecutionPolicy Bypass -File installsysmonviz.ps1

# Everything will go into this folder on your desktop
$p = [Environment]::GetFolderPath("Desktop") + "\sysmonviz"
New-Item -Force -ItemType directory -Path $p
cd $p

# download the necessary files
Import-Module BitsTransfer
Start-BitsTransfer -Source "https://raw.githubusercontent.com/jymcheong/SysmonResources/master/5.%20Threat%20Analytics/orientDB/filemonitor.js" -Destination "$p\filemonitor.js"
Start-BitsTransfer -Source "https://raw.githubusercontent.com/jymcheong/SysmonResources/master/5.%20Threat%20Analytics/orientDB/node8win32.zip" -Destination "$p\node8win32.zip"

# unzip the portable nodejs-8
$shell = New-Object -ComObject Shell.Application
$zip = $shell.NameSpace("$p\node8win32.zip"); foreach($item in $zip.items()) { $shell.Namespace($p).copyhere($item) }

if(Test-Path C:\Windows\DataFusion\logs) {
    $logpath = "C:\Windows\DataFusion\logs"
}
if(Test-Path C:\sysmonviz\logs) {
    $logpath = "C:\sysmonviz\logs"
}
$filecontents = Get-Content "$p\filemonitor.js"
$filecontents = $filecontents -replace 'TARGETDIR', $logpath 
$filecontents = $filecontents -replace 'ODBHOST', $ODBhost 
$filecontents |  Set-Content "$p\filemonitor.js"
# move the script into the extracted folder
Move-Item $p\filemonitor.js $p\node8win32

# create a windows scheduled task in Win 7 powershell 2.0 onwards - http://woshub.com/how-to-create-scheduled-task-using-powershell/
$TaskName = "NewFileMonitorTask"
$TaskDescription = "Running filemonitor nodejs script from Task Scheduler"
$TaskCommand = "$p\node8win32\startfilemonitor.bat"
$TaskScript = ""
$TaskArg = ""
$TaskStartTime = [datetime]::Now.AddMinutes(1)
$service = new-object -ComObject("Schedule.Service")
$service.Connect()
$rootFolder = $service.GetFolder("\")
$TaskDefinition = $service.NewTask(0)
$TaskDefinition.RegistrationInfo.Description = "$TaskDescription"
$TaskDefinition.Settings.Enabled = $true
$TaskDefinition.Settings.AllowDemandStart = $true
$triggers = $TaskDefinition.Triggers
#http://msdn.microsoft.com/en-us/library/windows/desktop/aa383915(v=vs.85).aspx
$trigger = $triggers.Create(8)
$trigger.StartBoundary = $TaskStartTime.ToString("yyyy-MM-dd'T'HH:mm:ss")
$trigger.Enabled = $true
# http://msdn.microsoft.com/en-us/library/windows/desktop/aa381841(v=vs.85).aspx
$Action = $TaskDefinition.Actions.Create(0)
$action.Path = "$TaskCommand"
$action.Arguments = "$TaskArg"
#http://msdn.microsoft.com/en-us/library/windows/desktop/aa381365(v=vs.85).aspx
$rootFolder.RegisterTaskDefinition("$TaskName",$TaskDefinition,6,"System",$null,5)

notepad "$p\node8win32\filemonitor.js"
Start-Sleep -s 1
[System.Windows.MessageBox]::Show('PLS CHANGE OrientDB Host string')