# Use a Admin CMD console & type:  powershell -ExecutionPolicy Bypass -File installsysmonviz.ps1
$p = [Environment]::GetFolderPath("Desktop") + "\sysmonviz"
New-Item -Force -ItemType directory -Path $p
cd $p
(New-Object System.Net.WebClient).DownloadFile("https://raw.githubusercontent.com/jymcheong/SysmonResources/master/5.%20Threat%20Analytics/orientDB/filemonitor.js", [Environment]::GetFolderPath("Desktop") + "\sysmonviz\filemonitor.js")

# install chocolatey 
Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
choco install nodejs --version 8.2.0 -y

# install nodejs
choco install microsoft-visual-cpp-build-tools -y 

# nodejs windows enviroment is a pain to setup
# DO NOT use Win7 32bit for this
"%PROGRAMFILES%\nodejs\nodevars.bat"
npm install --global --production windows-build-tools

# also usable for non-windows environment
npm install --global node-gyp

# something wrong with global in windows... install as local modules
npm install nsfw
npm install event-stream
npm install orientjs

node filemonitor.js
