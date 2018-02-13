# SETHC.exe Elevated Backdoor

## Background

Sethc.exe is a process associated with Windows NT High Contrast Invocation and is part of Microsoft® Windows® Operating System. With default Windows settings, this process is run when the shift is pressed 5 times in sequence, to invoke the StickyKeys configuration window. 

More info: https://attack.mitre.org/wiki/Technique/T1015

## Empire Module

![](img/module.png)

The Empire module sets up debugger to launch cmd.exe when sethc.exe is executed. If we press Shift button 5 times, we will get an Empire session running under logon user context. But if it were pressed at the Windows logon screen, we get a privileged session:

![](img/systemSession.png)

Notice 2nd row, Username that is SYSTEM, that session is the result of invoking sethc at the winlogon screen. This type of backdoor is commonly used with RDP. 

## Observations



## Questions

