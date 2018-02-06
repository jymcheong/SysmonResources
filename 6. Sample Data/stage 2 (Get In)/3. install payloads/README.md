# Install Payload for Persistence
## Background
Persistence simply means payload will run again either upon startup/reboot or certain trigger, so as to re-establish C2 (Command & Control) session with the remote/external C2 server. 

Beyond payload types, persistence can be further divided into **userland** or **elevated** installations. Userland means payload runs as standard user after the installation, the latter means running as admin or SYSTEM rights, installation typically performed after Escalation of Privilege.

## Empire Framework

For this set of samples, I will be using [Empire post-exploitation framework](https://github.com/EmpireProject/Empire). The sample logs aim to highlight the payload installation steps & relate to the various Sysmon event types & fields.

[https://speakerdeck.com/hshrzd/wicked-malware-persistence-methods](https://speakerdeck.com/hshrzd/wicked-malware-persistence-methods) This is a very good deck that covers many prevailing malware persistence methods.

## Change in Log Format
I will be export to EVTX file instead of Json. It's probably more convenient for users who are on Windows to just double click the file & view within Event Viewer. It's also easier & less error prone on my part to plough through a large text file to find the right rows. One can also use Powershell to convert it to Json if so desire:

`Get-WinEvent -Path '.\schtask persistence.evtx' | select Message | ConvertTo-Json > file.json`

The output is different from [Run-Payload-samples folder](https://github.com/jymcheong/SysmonResources/tree/master/6.%20Sample%20Data/stage%202%20(Get%20In)/2.%20run%20payloads) but all the necessary field-values are there. 
