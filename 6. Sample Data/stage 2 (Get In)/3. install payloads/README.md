# Install Payload for Persistence
Persistence simply means payload will run again either upon startup/reboot or certain trigger, so as to re-establish C2 (Command & Control) session with the remote/external C2 server. 

Beyond payload types, persistence is further divided into userland or elevated. The former means running as standard user, the latter means running as admin or SYSTEM rights after Escalation of Privilege.

For this set of samples, I will be using [Empire post-exploitation framework](https://github.com/EmpireProject/Empire). 