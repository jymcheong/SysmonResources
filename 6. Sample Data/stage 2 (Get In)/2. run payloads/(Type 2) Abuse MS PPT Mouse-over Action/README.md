# Abuse PowerPoint Actions

## Background
This is a type 2, it's a feature not a bug ;) Nice for App-Control/Whitelisting evasion + social engineering/deception (eg. something visually compelling to mouse-over).

![](addaction.png)

## Payload
I will also use this sample to illustrate the idea of attack-chaining by linking it to [another sample which is Type 1 - Rundll32 Allthethings.dll](https://github.com/jymcheong/SysmonResources/tree/master/6.%20Sample%20Data/stage%202%20(Get%20In)/2.%20run%20payloads/(Type%201)%20Allthethings.dll%20with%20rundll32). I also include a normal Powerpoint file open log sample for comparison & constrast.

## Observations

### open pptx file eventlog.txt (normal)
1. Unlike the [Excel sample](https://github.com/jymcheong/SysmonResources/tree/master/6.%20Sample%20Data/stage%202%20(Get%20In)/2.%20run%20payloads/(Type%202)%20Abuse%20MS%20Excel%20DDE), we can see which Powerpoint file was opened from CmdLine field (log line 1).