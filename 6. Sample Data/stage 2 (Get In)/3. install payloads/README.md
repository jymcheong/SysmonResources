# Install Payload for Persistence
Persistence simply means payload will run again either upon startup/reboot or certain trigger, so as to re-establish C2 (Command & Control) session with the remote/external C2 server. 

Beyond payload types, persistence is further divided into userland or elevated. The former means running as standard user, the latter means running as admin or SYSTEM rights after Escalation of Privilege.

For this set of samples, I will be using [Empire post-exploitation framework](https://github.com/EmpireProject/Empire). The sample logs aim to highlight the installation step & payload execution after a startup & relate to the various Sysmon event types & fields.

[https://speakerdeck.com/hshrzd/wicked-malware-persistence-methods](https://speakerdeck.com/hshrzd/wicked-malware-persistence-methods) This is a very good deck that covers many prevailing malware persistence methods.