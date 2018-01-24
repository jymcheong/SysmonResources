# Sysmon Configuration References

* [https://github.com/SwiftOnSecurity/sysmon-config](https://github.com/SwiftOnSecurity/sysmon-config) 
The file provided should function as a great starting point for system change monitoring in a self-contained package. This configuration and results should give you a good idea of what's possible for Sysmon. Note that this does not track things like authentication and other Windows events that are also vital for incident investigation.

* [https://github.com/ion-storm/sysmon-config](https://github.com/ion-storm/sysmon-config) This is a fork of the earlier configuration & it includes a way to hide Sysmon from services.msc. The latest version of Sysmon allows changing of service name but note that the actual file path (C:\Windows\Sysmon.exe) is unchanged. 

* [https://github.com/Cyb3rWard0g/ThreatHunter-Playbook](https://github.com/Cyb3rWard0g/ThreatHunter-Playbook) A Threat hunter's playbook to aid the development of techniques and hypothesis for hunting campaigns by leveraging Sysmon and Windows Events logs. This project will provide specific chains of events exclusively at the host level so that you can take them and develop logic to deploy queries or alerts in your preferred tool or format such as Splunk, ELK, Sigma, GrayLog etc. This repo will follow the structure of the [MITRE ATT&CK framework](https://attack.mitre.org) which categorizes post-compromise adversary behavior in tactical groups. In addition, it will provide information about hunting tools/platforms developed by the infosec community for testing and enterprise-wide hunting.

* [https://github.com/nshalabi/SysmonTools](https://github.com/nshalabi/SysmonTools) Sysmon Shell can aid in writing and applying Sysmon XML configuration through a simple GUI interface.


Some events are filtered out (eg. Process Termination of programs running from Windows\) but they may be useful for certain [analysis like UAC bypass](https://medium.com/@jym/uac-bypass-analysis-7a1379d21d36), in which the timing between Consent.exe creation & termination is very short. We won't be able to calculate that if such events are filtered away.

If you are running a lab, you may want to simulate the various applications executions within the lab & ingest all events first. These user applications, along with the file-types are likely vectors for code-execution. **Applying template configuration blindly may result to 'blind-spots'.**