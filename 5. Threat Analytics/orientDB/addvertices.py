import pyorient
import sys
import os.path
import codecs
import json
import re

uid = "root"
pwd = "Password1234"

sys.argv += 'events.txt'.split()

if len(sys.argv) == 0:
    print('please provide path to winevent log file from collected by Nxlog!')
    exit

if  not os.path.exists(sys.argv[0]):
    print('please provide path to winevent log file from collected by Nxlog!')
    exit

# setup OrientDB connection
client = pyorient.OrientDB("localhost", 2424)
session_id = client.connect(uid, pwd)
client.db_open("DataFusion", uid, pwd)

eventIdLookup = {1:'ProcessCreate', 2:'FileCreateTime', 3:'NetworkConnect'}

lines = codecs.open(sys.argv[1], 'r', encoding='utf-8').readlines()
for event in lines:
    e = json.loads(event)

    # if not Sysmon or DataFusion event, insert into WinEvent class
    classname = 'WinEvent' 

    # Sysmon events
    if '"SourceName":"Microsoft-Windows-Sysmon"' in event:
        if 'Keywords' in e: #negative no. is too big, so cast to string
            e['Keywords'] = str(e['Keywords']) 
        classname = eventIdLookup[e['EventID']]
        # rename the field
        e['SysmonProcessId'] = e['ProcessID']
        del e['ProcessID']
        # extract ProcessId from Message field
        processId = re.search("ProcessId: (\d+)", event)
        e['ProcessId'] = processId.group(1)
    
    # DataFusion events
    # TODO create OrientDB for each possible action
    if '"SourceName":"DataFuseUserActions"' in event:
        del e['ProcessID'] # deleted because there's a ProcessId field in Message        
        uat = json.loads(e['Message'])
        for k,v in uat.items():
            e[k] = v
        classname = e['Action']

    client.command("insert into " + classname + " content " + json.dumps(e))
    