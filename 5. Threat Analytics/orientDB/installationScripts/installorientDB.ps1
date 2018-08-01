$root_pass = 'Password1234'
$p = [Environment]::GetFolderPath("Desktop") + "\orientDBsetup"
New-Item -Force -ItemType directory -Path $p
cd $p

# download ODB 3.0.4
Import-Module BitsTransfer
Start-BitsTransfer -Source https://s3.us-east-2.amazonaws.com/orientdb3/releases/3.0.4/orientdb-3.0.4.zip -Destination "$p\orientdb.zip"

# unzip orientdb.zip
$shell = New-Object -ComObject Shell.Application
$zip = $shell.NameSpace("$p\orientdb.zip"); foreach($item in $zip.items()) { $shell.Namespace($p).copyhere($item) }

# start orientDB with root pass configured above
[Environment]::SetEnvironmentVariable("ORIENTDB_ROOT_PASSWORD",$root_pass)
[Environment]::SetEnvironmentVariable("ORIENTDB_HOME", "$p\orientdb-3.0.4")

# check for java in path, quit if don't exist, no point continuing
Start-Process -FilePath "$env:comspec"  -ArgumentList "/c orientdb-3.0.4\bin\server.bat"

Write-host "\n"
Read-Host -Prompt  "Please check the orientDB server console for 'Server is Active' before pressing any key to continue"
Start-BitsTransfer -Source https://github.com/jymcheong/SysmonResources/raw/master/5.%20Threat%20Analytics/orientDB/schema_and_functions.gz -Destination "$p\schema_and_functions.gz"
orientdb-3.0.4\bin\console.bat "create database remote:localhost\DataFusion root $root_pass; import database schema_and_functions.gz;"