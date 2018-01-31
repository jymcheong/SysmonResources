# Sysmon Configuration References

* [https://github.com/SwiftOnSecurity/sysmon-config](https://github.com/SwiftOnSecurity/sysmon-config) 
The file provided should function as a great starting point for system change monitoring in a self-contained package. This configuration and results should give you a good idea of what's possible for Sysmon. Note that this does not track things like authentication and other Windows events that are also vital for incident investigation.

* [https://github.com/ion-storm/sysmon-config](https://github.com/ion-storm/sysmon-config) This is a fork of the earlier configuration & it includes a way to hide Sysmon from services.msc. The latest version of Sysmon allows changing of service name but note that the actual file path (C:\Windows\Sysmon.exe) is unchanged. 

* [https://github.com/nshalabi/SysmonTools](https://github.com/nshalabi/SysmonTools) Sysmon Shell can aid in writing and applying Sysmon XML configuration through a simple GUI interface.


Some events are filtered out (eg. Process Termination of programs running from Windows\) but they may be useful for certain [analysis like UAC bypass](https://medium.com/@jym/uac-bypass-analysis-7a1379d21d36), in which the timing between Consent.exe creation & termination is very short. We won't be able to calculate that if such events are filtered away.

If you are running a lab, you may want to simulate the various applications executions within the lab & ingest all events first. These user applications, along with the file-types are likely vectors for code-execution. **Applying template configuration blindly may result to 'blind-spots'.**

### Basic without configuration file (as admin):

`sysmon -accepteula -i -h * -n`

-h * 	: use all hash algorithm

-n 		: log network connections

More for lab & single machine use/analysis, not suitable for production use due to large volume of events. This does not log ProcessAccess & module loads. 

### Adapted from SwiftOnSecurity Config
[smconfig.xml](smconfig.xml)

* Capture * from ProcessTerminate, ProcessAccess, PipeMonitoring & Network Connection Initiated

* The rest are largely the same as [SoS's configuration](https://github.com/SwiftOnSecurity/sysmon-config/blob/master/sysmonconfig-export.xml)

Just to have the idea how noisy is Event 10 ProcessAccess. A little more of ProcessAccess significance: [Detecting Mimikatz](https://cyberwardog.blogspot.sg/2017/03/). 

While experimenting with the filtering rules, I noticed certain event type eg. ProcessTerminate will log even when there's no include/exclude rules but not so for let's say ProcessAccess, NetworkConnect & RawAccessRead. 

For a few event types, I used a silly exclude rule of a non-existent ProcessId to include all.