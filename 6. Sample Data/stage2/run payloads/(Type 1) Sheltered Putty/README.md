# Tainted Binaries
## Background
Even with Google security muscles & brains, a 3-stage malware still managed to get into the [Playstore](http://www.zdnet.com/article/android-security-sneaky-three-stage-malware-found-in-google-play-store/), so it is not surprising for Windows binaries to be tainted by backdoors & malware & widely shared in pirated warez sites/torrents. 

## Payload
For this specific example, I used [Shelter AV evasion](https://www.shellterproject.com/introducing-shellter/) to infect a clean Putty.exe (a popular windows SSH client). I also ran the clean/original Putty before it was infected on the same VM & captured the logs. Note that Windows Defender in Win10 will block this. 

I had to disable my Win-defender so that the payload can run & connect to my Kali Meterpreter HTTPS listener (C2). I consider this a Type 1 binary executable payload in my simplified classification approach ( [1] binary exe/dll vs [2] scripts vs [3] anything else). I will explain the rationale behind this approach.

## Observations
One might ask, "*how do we know it's clean?*". From *"clean x86 putty eventlog.txt"* line #1 (putty before Shelter infection), you can see there is a **SHA1 field value** that it is in the author's sha1sum list [https://the.earth.li/~sgtatham/putty/0.70/sha1sums](https://the.earth.li/~sgtatham/putty/0.70/sha1sums), look for w32/putty.exe.

## Questions