# Use a Admin CMD console & paste:  powershell -nop -c "$odbserver='YOUR_ODB_HOST';iex(New-Object Net.WebClient).DownloadString('https://raw.githubusercontent.com/jymcheong/SysmonResources/master/5.%20Threat%20Analytics/orientDB/installationScripts/installsysmonviz.ps1')"
$nxlogpath = "c:\sysmonviz\nxlog"
$p = [Environment]::GetFolderPath("Desktop") + "\sysmonviz"
New-Item -Force -ItemType directory -Path $p
cd $p

Import-Module BitsTransfer
(New-Object System.Net.WebClient).DownloadFile("https://download.sysinternals.com/files/Sysmon.zip", "$p\sysmon.zip")
Start-BitsTransfer -Source "https://nxlog.co/system/files/products/files/348/nxlog-ce-2.10.2102.msi" -Destination "$p\nxlog.msi"
Start-BitsTransfer -Source "https://raw.githubusercontent.com/jymcheong/SysmonResources/master/5.%20Threat%20Analytics/orientDB/configFiles/smconfig.xml" -Destination "$p\smconfig.xml"
Start-BitsTransfer -Source "https://raw.githubusercontent.com/jymcheong/SysmonResources/master/5.%20Threat%20Analytics/orientDB/configFiles/nxlog.conf" -Destination "$p\nxlog.conf"
Start-BitsTransfer -Source "https://raw.githubusercontent.com/jymcheong/SysmonResources/master/5.%20Threat%20Analytics/orientDB/filemonitor.js" -Destination "$p\filemonitor.js"

# unzip Sysmon.zip
$shell = New-Object -ComObject Shell.Application
$zip = $shell.NameSpace("$p\Sysmon.zip"); foreach($item in $zip.items()) { $shell.Namespace($p).copyhere($item) }

# tries to uninstall sysmon, then installs latest Sysmon
If (Get-WmiObject -Class Win32_Service -Filter "Name='Sysmon'") {
    Start-Process -FilePath "Sysmon.exe" -Wait -ArgumentList "-u"
}
If (Get-WmiObject -Class Win32_Service -Filter "Name='Sysmon64'") {
    Start-Process -FilePath "Sysmon64.exe" -Wait -ArgumentList "-u"
}
Start-Process -FilePath "$env:comspec" -Verb runAs -Wait -ArgumentList "/c $p\Sysmon.exe -accepteula -l -n -i $p\smconfig.xml"

# remove existing Nxlog
$application = Get-WmiObject Win32_Product -filter "Name='NXLog-CE'"
if($application) { $application.uninstall() }

# installs Nxlog
$arg = '/c msiexec /i nxlog.msi INSTALLDIR="' + $nxlogpath + '" /qb'
Start-Process -FilePath "$env:comspec" -Verb runAs -Wait -ArgumentList $arg
$nxlogpath = $nxlogpath -replace "nxlog" , ""
New-Item -Force -ItemType directory -Path "$nxlogpath\logs"
$logpath = "$nxlogpath\logs"

# copies custom nxlog
$confcontents = Get-Content "$p\nxlog.conf"
$confcontents = $confcontents -replace 'TARGETDIR', $nxlogpath 
$nxlogpath = $nxlogpath + 'nxlog\conf\nxlog.conf'
$confcontents |  Set-Content $nxlogpath

# starts nxlog service
$scpath = $env:WinDir + "\system32\sc.exe"
Start-Process -FilePath $scpath -Wait -ArgumentList "start nxlog"

ii $logpath # use explorer to open logs folder, you should see logs rotated

powershell -nop -c "`$odbserver='$odbserver'; iex(New-Object Net.WebClient).DownloadString('https://raw.githubusercontent.com/jymcheong/SysmonResources/master/5.%20Threat%20Analytics/orientDB/installationScripts/installfilemonitor.ps1')"