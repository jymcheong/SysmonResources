# External Command & Control (C2)

## External vs Internal C2

I believe it is important to distinct between external from internal C2. *Why? For instance in an air-gapped environment, assuming the adversary managed to get a backdoor into the isolated machines, s/he still needs a channel for the compromised machine to communicate with. That by definition should be INTERNAL C2 since the controller will typically be within the targetted premises.* 

## External -> Pivot -> Internal

![](img/c2types.png)

External C2 on the other hand refers to remote-controlling machines that have some form of Internet access. There's also another important notion known as the 'Pivot', which we can think of as a stepping stone for the adversary to reach a machine that has no direct internet access but is allowed to communicate with a machine that is connected to the Internet. 

In my Attack Life Cycle, I deliberately part Internal C2 as a Stage 3 tactic. From an incident response angle, sometimes we might totally missed External C2 but sensors may flag something suspicious between internal hosts.

## Beaconing vs Non-beaconing

Many of these backdoors & malware tend to call-back to the C2 server for the next instruction. This periodic communication is sometimes known as beaconing. The samples in this sub-folder is organised into these two general types. There could be various communication protocols used. The most covert ones are those that you are not monitoring, sometimes also known as "side-channels". 

Sorry I don't have samples for "side-channels" but an interesting list of air-gap circumventing research can be found at: https://cyber.bgu.ac.il//advanced-cyber/airgap 