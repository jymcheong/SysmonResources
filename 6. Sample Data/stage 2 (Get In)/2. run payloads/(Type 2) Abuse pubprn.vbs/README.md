# Abuse System Scripting

## Background
So far the samples are largely related to Microsoft Office, suppose we have an environment that uses ***let's say we do not use Office at all, does it mean there are no means to run arbitrary codes?*** This sample addresses that question. 

## Payload
Much like Unixes, there are many native scripting capabilities within Windows. There are tools like wscript, cscript, jscript, batch, powershell & so on. Beyond direct scripting, there are also indirect scripting that can be embedded like HTML, CHM, PDF & various file formats that support embedding of scripts, sometimes termed as Active Contents. ***Think of them as programmatic functionalities that does not require a binary file like PE, Java applets, .NET & the likes.***

This sample uses built-in script found at ***C:\\Windows\\System32\\Printing_Admin_Scripts\\en-US\\pubprn.vbs***. Those who are curious can find out more here: [https://www.slideshare.net/enigma0x3/windows-operating-system-archaeology](https://www.slideshare.net/enigma0x3/windows-operating-system-archaeology). 

The root-cause/problem is rather similar to web-app vulnerabilities ([think OWASP](https://www.owasp.org/index.php/Category:OWASP_Top_Ten_Project)), not checking the inputs in this case.

The reason for picking this sample out of many is its ability to load a remote [Windows Scriptlet SCT script](https://fileinfo.com/extension/sct). Some may call it file-less, but it's rather a misnomer since the system does cache the script into IE cache folder. Such payload can be delivered as a LNK with a deceiving icon, together with some deception (eg. social engineering) to trick the user to launch.

## Observations
* [From line 1](https://github.com/jymcheong/SysmonResources/blob/450663a4aa2fa81f0fbaaede4a6da334bb1f9aa9/6.%20Sample%20Data/stage%202%20(Get%20In)/2.%20run%20payloads/(Type%202)%20Abuse%20pubprn.vbs/pubprn%20popping%20calc%20eventlog.txt#L1), we see how it was launched from CmdLine. The URL of the SCT can be seen from that line.

* The SCT in turns cause calc.exe to run [in line 2](https://github.com/jymcheong/SysmonResources/blob/450663a4aa2fa81f0fbaaede4a6da334bb1f9aa9/6.%20Sample%20Data/stage%202%20(Get%20In)/2.%20run%20payloads/(Type%202)%20Abuse%20pubprn.vbs/pubprn%20popping%20calc%20eventlog.txt#L2).

I kept this sample simple, but only imagination is limiting us to deliver anything other than calculator. So again, it's very much similar to other MS Office examples.

## Questions
How often is scripting used in your client environment? 