# Run as ADMINISTRATOR
$nxlogpath = "c:\sysmonviz\nxlog"
$p = [Environment]::GetFolderPath("Desktop") + "\sysmonviz"
New-Item -Force -ItemType directory -Path $p
cd $p
(New-Object System.Net.WebClient).DownloadFile("https://download.sysinternals.com/files/Sysmon.zip", [Environment]::GetFolderPath("Desktop") + "\sysmonviz\sysmon.zip")
(New-Object System.Net.WebClient).DownloadFile("https://nxlog.co/system/files/products/files/348/nxlog-ce-2.10.2102.msi", [Environment]::GetFolderPath("Desktop") + "\sysmonviz\nxlog.msi")
(New-Object System.Net.WebClient).DownloadFile("https://raw.githubusercontent.com/jymcheong/SysmonResources/master/5.%20Threat%20Analytics/orientDB/configFiles/smconfig.xml", [Environment]::GetFolderPath("Desktop") + "\sysmonviz\smconfig.xml")
(New-Object System.Net.WebClient).DownloadFile("https://raw.githubusercontent.com/jymcheong/SysmonResources/master/5.%20Threat%20Analytics/orientDB/configFiles/nxlog.conf", [Environment]::GetFolderPath("Desktop") + "\sysmonviz\nxlog.conf")
(New-Object System.Net.WebClient).DownloadFile("https://raw.githubusercontent.com/jymcheong/SysmonResources/master/5.%20Threat%20Analytics/orientDB/filemonitor.js", [Environment]::GetFolderPath("Desktop") + "\sysmonviz\filemonitor.js")

# unzip Sysmon.zip
$shell = New-Object -ComObject Shell.Application
$zip = $shell.NameSpace($p + “\Sysmon.zip"); foreach($item in $zip.items()) { $shell.Namespace($p).copyhere($item) }

# tries to uninstall sysmon, then installs latest Sysmon
Start-Process -FilePath "Sysmon.exe" -Wait -ArgumentList "-u"
Start-Process -FilePath "sysmon.exe" -Wait -ArgumentList "-accepteula -l -n -i smconfig.xml"

# installs Nxlog
$arg = '/c msiexec /i nxlog.msi INSTALLDIR="' + $nxlogpath + '" /qb'
Start-Process -FilePath "$env:comspec" -Verb runAs -Wait -ArgumentList $arg
$nxlogpath = $nxlogpath -replace "nxlog" , ""
New-Item -Force -ItemType directory -Path "$nxlogpath\logs"
ii "$nxlogpath\logs" # use explorer to open logs folder, you should see logs rotated

# copies custom nxlog
$confcontents = Get-Content nxlog.conf
$confcontents = $confcontents -replace 'TARGETDIR', $nxlogpath 
$nxlogpath = $nxlogpath + 'nxlog\conf\nxlog.conf'
$confcontents |  Set-Content $nxlogpath

# starts nxlog service
$scpath = $env:WinDir + "\system32\sc.exe"
Start-Process -FilePath $scpath -Wait -ArgumentList "start nxlog"
$wshell = New-Object -ComObject Wscript.Shell

# install chocolatey 
Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
choco install nodejs --version 8.2.0 -y

choco install microsoft-build-tools -y
choco install microsoft-visual-cpp-build-tools -y 
# requires reboot & re-run the above line

npm install --global --production windows-build-tools
npm install --global node-gyp

# something wrong with global in windows... install as local modules
npm install nsfw
npm install event-stream
npm install orientjs

$filemonscript = Get-Content filemonitor.js
$filemonscript = $filemonscript -replace 'C:/Windows/Datafusion/logs', 'C:/sysmonviz/logs'