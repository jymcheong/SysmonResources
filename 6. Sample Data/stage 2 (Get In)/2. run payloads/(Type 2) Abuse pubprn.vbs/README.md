# Abuse System Scripting

## Background
So far the samples are largely related to Microsoft Office, suppose we have an environment that uses let's say do not use that at all, does it mean there are no means to run arbitrary codes? This sample address that question. 

## Payload
Much like Unixes, there are many native scripting capabilities within Windows. There are tools like wscript, cscript, jscript, batch, powershell & so on. Beyond direct scripting, there are also indirect scripting that can be embedded like HTML, CHM, PDF & various file formats that support embedding of scripts, sometimes termed as Active Contents. ***Think of them as programmatic functionalities that does not require a binary file like PE, Java applets, .NET & the likes.***

This sample uses a built in script within Windows found at ***C:\\Windows\\System32\\Printing_Admin_Scripts\\en-US\\pubprn.vbs***. Those who are curious can find out more here: [https://www.slideshare.net/enigma0x3/windows-operating-system-archaeology](https://www.slideshare.net/enigma0x3/windows-operating-system-archaeology). The root cause is rather similar to web-app vulnerabilities ([think OWASP](https://www.owasp.org/index.php/Category:OWASP_Top_Ten_Project)), not checking the inputs in this case.

The reason for picking this sample out of many is its ability to load a remote [Windows Scriptlet SCT script](https://fileinfo.com/extension/sct). Some may call it file-less, but it's rather a misnomer since the system does cache the script into IE cache folder. Such payload can be delivered as a LNK with a deceiving icon, together with some deception (eg. social engineering) to trick the user to launch.

## Observations
* From line 1, we see how it is launch from CmdLine. The URL of the SCT can be seen from that line
