# Veil Intro
[Veil](https://github.com/Veil-Framework/Veil) is a tool designed to generate metasploit payloads that bypass common anti-virus solutions.

I personally prefer C# but one can go for any of it so long it doesn't get caught by AV. 

Using it: [https://www.youtube.com/watch?v=3WPoD8F5V64](https://www.youtube.com/watch?v=3WPoD8F5V64)

# Unsigned Binaries
In the parent folder README, I talked about payload types. This type is essentially an unsigned PE that makes outbound network connections (doesn't matter if it is external or intranet destination).

For an environment without application whitelisting/control, it will be a pain to figure out which is ok or malicious just from Process Creation & Network Connection event types.