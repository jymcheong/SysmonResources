# Sysmon Resources
Consolidation of various resources related to [Microsoft Sysmon](https://docs.microsoft.com/en-us/sysinternals/downloads/sysmon).

# What is Sysmon?
System Monitor (Sysmon) is a Windows system service and device driver that, once installed on a system, remains resident across system reboots to monitor and log system activity to the Windows event log. It provides detailed information about process creations, network connections, and changes to file creation time...

Sysmon includes the following capabilities:

* Logs process creation with full command line for both current and parent processes.

*  Records the hash of process image files using SHA1 (the default), MD5, SHA256 or IMPHASH.

* Multiple hashes can be used at the same time.
* Includes a process GUID in process create events to allow for correlation of events even when Windows reuses process IDs.
* Include a session GUID in each events to allow correlation of events on same logon session.
* Logs loading of drivers or DLLs with their signatures and hashes.
* Logs opens for raw read access of disks and volumes
* Optionally logs network connections, including each connection’s source process, IP addresses, port numbers, hostnames and port names.
* Detects changes in file creation time to understand when a file was really created. Modification of file create timestamps is a technique commonly used by malware to cover its tracks.
* Automatically reload configuration if changed in the registry.
* Rule filtering to include or exclude certain events dynamically.
* Generates events from early in the boot process to capture activity made by even sophisticated kernel-mode malware.