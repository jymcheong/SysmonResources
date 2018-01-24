# Viewing Data Locally

If you are just working on a single machine, you may not want to setup a backend like ElasticSearch, Splunk of whatever. These are some tools for exploring events locally:

* Windows Event Viewer (run as admin) > Applications & Services Logs > Microsoft > Windows > Sysmon > Operational

* [Event Log Explorer](https://eventlogxp.com) Event Log Explorer is an effective software solution for viewing, analyzing and monitoring events recorded in Microsoft Windows event logs. Event Log Explorer greatly simplifies and speeds up the analysis of event logs (security, application, system, setup, directory service, DNS and others)...

* [https://github.com/nshalabi/SysmonTools](https://github.com/nshalabi/SysmonTools) Sysmon View helps in tracking and visualizing Sysmon logs by logically grouping and linking the various events generated using executable names, session GUIDs or the time of event, it also has easy to use search feature to look through all the events data, a GEO mapping of IP addresses and VirusTotal lookup for IP, domain and hashes.