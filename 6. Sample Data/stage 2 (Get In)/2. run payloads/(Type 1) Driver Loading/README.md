# Driver Loading

## Background
This particular sample isn't from malicious payload but loading driver should NOT be a common thing in most environment. If there's any update, it is usually performed together after some compatibility/stability testing.

## Observations
![](usb.png)

I used Event Log Explorer shareware to show some of the fields for this event (ID 6).

You can see UTC time, Image full-path, hashes & **most importantly whether it has valid signature & signer info**.

## Question(s)

How often do we see unsigned or invalid signatured drivers loading in a given environment?
