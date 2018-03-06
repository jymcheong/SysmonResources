# Payload-files in Removable Storage Media

## Payload

In my opinion, Type 1 executables & Type 2 malicious scripts/configurations are rather straight-forward with Sysmon Event ID, especially for controlled environments that enforce Application-Control/Whitelisting. And for that reason, I chose a LNK exploit ([CVE-2017-8464](https://portal.msrc.microsoft.com/en-US/security-guidance/advisory/CVE-2017-8464)) from Metasploit. If you are repeating this experiment, you will most probably need to temporary switch off your Anti-Virus engine.