param (
    $localPath = "C:\Windows\DataFusion\logs\*rotated*",
    $remotePath = "/uploads/",
    $backupPath = "C:\backup\"
)

try
{
    # Load WinSCP .NET assembly
    Add-Type -Path "WinSCPnet.dll"

    # Setup session options
    $sessionOptions = New-Object WinSCP.SessionOptions -Property @{
        Protocol = [WinSCP.Protocol]::Sftp
        HostName = "172.30.1.178"
        UserName = "uploader"
        Password = "P@55w0rd"
        SshHostKeyFingerprint = "ssh-ed25519 256 d2:e3:62:78:9d:a3:16:c5:92:01:ec:ca:56:12:8f:fe"
    }

    $session = New-Object WinSCP.Session

    try
    {
        # Connect
        $session.Open($sessionOptions)

        # Upload files, collect results
        $transferResult = $session.PutFiles($localPath, $remotePath)

        # Iterate over every transfer
        foreach ($transfer in $transferResult.Transfers)
        {
            # Success or error?
            if ($transfer.Error -eq $Null)
            {
                Write-Host "Upload of $($transfer.FileName) succeeded, moving to backup"
                # Upload succeeded, move source file to backup
                #Move-Item $transfer.FileName $backupPath
                Remove-Item $transfer.FileName
            }
            else
            {
                Write-Host "Upload of $($transfer.FileName) failed: $($transfer.Error.Message)"
            }
        }
    }
    finally
    {
        # Disconnect, clean up
        $session.Dispose()
    }

    exit 0
}
catch
{
    Write-Host "Error: $($_.Exception.Message)"
    exit 1
}
