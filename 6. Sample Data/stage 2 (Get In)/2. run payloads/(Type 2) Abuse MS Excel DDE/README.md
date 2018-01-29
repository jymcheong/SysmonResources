# Microsoft Dynamic Data Exchange Abuse
Excerpt from [Microsoft's Security Advisory 4053440](https://technet.microsoft.com/en-us/library/security/4053440.aspx) (headers & emphasis are added by me, not part of the original text): 

## What is it
Microsoft Office provides several methods for transferring data between applications. The DDE protocol is a set of messages and guidelines. It sends messages between applications that share data, and uses shared memory to exchange data between applications. Applications can use the DDE protocol for one-time data transfers and for continuous exchanges in which applications send updates to one another as new data becomes available.

## Threat Scenario
In an email attack scenario, an attacker could leverage the DDE protocol by sending a specially crafted file to the user and then convincing the user to open the file, typically by way of an enticement in an email. **The attacker would have to convince the user to disable Protected Mode and click through one or more additional prompts**. As email attachments are a primary method an attacker could use to spread malware, Microsoft strongly recommends that customers exercise caution when opening suspicious file attachments.

## Payload
Instead of Outlook (email client), I used an specially crafted CSV that "pops a calculator", which is a popular test-case that some like to do to show arbitrary code execution. I want to use this set of log samples is to contrast the parent-child process chain between normal usage vs code-execution with DDE.

## Observations

### Normal accessing of a blank Excel file
![](img/normal.png)

1. First line of "opening a blank xlsx eventlog.txt" is a *"Process Create"* event for Excel. We can see the various related fields including ParentImage which is Explorer.exe. We can infer that the user launch it from Windows Explorer.

2. From that first log line, we can't tell what file was opened. For certain other Office apps, we may be able to see that from CommandLine, but somehow not for Excel.

3. There can be other events totally not related, which could be hard to eye-ball, especially with lines & lines of text. That's the main reason why Endpoint Detection & Response or whatever Threat Hunting solutions tend to visualise in some forms of graph or timeline. 

4. Since I am not visualising this, I used a text-editor & search with the ProcessGUID value. From the screenshot, we can see there are 6 matches, spanning across lines 1, 3 & 4.

5. Line 3 tells us that Excel changed a file's creation time.

6. Line 4 tells us that Excel terminated.

7. Between Excel Process Creation to Terminate, there's only a single pair of Parent -> Child relationship. Keep that in mind & contrast that to the following...