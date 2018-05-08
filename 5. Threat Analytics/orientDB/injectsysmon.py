import pyorient
import codecs
import json

uid = "YOUR_ID"
pwd = "YOUR_PWD"
filepath = 'template eventlog.txt'  # change to your file path

client = pyorient.OrientDB("localhost", 2424)
session_id = client.connect(uid, pwd)
client.db_open("Sysmon", uid, pwd)

lines = codecs.open(filepath, 'r', encoding='utf-8').readlines()
for event in lines:
    e = json.loads(event)
    e['Keywords'] = str(e['Keywords'])
    client.command("insert into Sysmon content " + json.dumps(e))
    if("ParentProcessGuid" in event): # only link if there's a ParentProcessGuid
        edgecmd = "Create Edge ParentOf FROM (Select from Sysmon Where EventID = 1 AND ProcessGuid = '{0}' AND Hostname = '{1}') TO \
                    (SELECT FROM Sysmon Where EventID = 1 AND ProcessGuid = '{2}' AND \
                    Hostname = '{3}')".format(e["ParentProcessGuid"],e['Hostname'],e["ProcessGuid"],e['Hostname'])
        try:
            client.command(edgecmd)
        except: # there are cases when parent process event was not captured
            print('likely no source vertex')