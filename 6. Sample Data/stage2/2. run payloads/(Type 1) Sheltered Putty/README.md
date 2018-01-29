# Tainted Binaries
## Background
Even with Google security muscles & brains, a 3-stage malware still managed to get into the [Playstore](http://www.zdnet.com/article/android-security-sneaky-three-stage-malware-found-in-google-play-store/), so it is not surprising for Windows binaries to be tainted by backdoors & malware & widely shared in pirated warez sites/torrents. 

## Payload
For this specific example, I used [Shelter AV evasion](https://www.shellterproject.com/introducing-shellter/) to infect a clean Putty.exe (a popular windows SSH client). I also ran the clean/original Putty before it was infected on the same VM & captured the logs. Note that Windows Defender in Win10 will block this. 

I had to disable my Win-defender so that the payload can run & connect to my Kali Meterpreter HTTPS listener (C2). I consider this a Type 1 binary executable payload in my simplified classification approach ( [1] binary exe/dll vs [2] scripts vs [3] anything else). I will explain the rationale behind this approach.

## Observations
### Original Putty Execution
One might ask, "*how do we know it's clean?*". From *"clean x86 putty eventlog.txt"* [line #1](https://github.com/jymcheong/SysmonResources/blob/2516d8d71d85f6282bb90420764beccb8bb77436/6.%20Sample%20Data/stage2/run%20payloads/(Type%201)%20Sheltered%20Putty/clean%20x86%20putty%20eventlog.txt#L1) (putty before Shelter infection), you can see there is a **SHA1 field value** ("Hashes":"SHA1=5EF9515E8FD92A254DD2DCDD9C4B50AFA8007B8F,...) that it is in the author's sha1sum list [https://the.earth.li/~sgtatham/putty/0.70/sha1sums](https://the.earth.li/~sgtatham/putty/0.70/sha1sums), look for w32/putty.exe. So one might say, *"Sure, the checksum can tell us it has not been changed or it's the same as the source-site's but what if it is already tainted?"*. Which brings us to the next sample.

### Shelter'ed Putty Execution
* First you will notice the SHA1 value is different

* Immediately after the ProcessCreate event, there's a Network Connection event to 192.168.181.197 (a Kali VM)

**Just to be clear, this does NOT mean every tainted PE will connect to a C2 immediately,** to avoid automated sandbox analysis, some samples may only execute logic upon certain conditions, eg. click of a certain button & so on. 

## Questions
* Has the software been changed or differ from the vendor's checksum?

* Is it common in your environment for user downloaded software to make network connections regardless to external or internal destinations?