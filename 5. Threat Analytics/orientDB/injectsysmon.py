import pyorient
import codecs
import json

client = pyorient.OrientDB("localhost", 2424)
session_id = client.connect("YOUR_ID", "YOUR_PWD")
client.db_open("Sysmon", "YOUR_ID", "YOUR_PWD")

filepath = 'template eventlog.txt'  # change to your file path
lines = codecs.open(filepath, 'r', encoding='utf-8').readlines()
for event in lines:
    e = json.loads(event)
    e['Keywords'] = ''
    client.command("insert into Sysmon content " + json.dumps(e))
    if("ParentProcessGuid" in event):
        edgecmd = "Create Edge ParentOf FROM (Select from Sysmon Where EventID = 1 AND ProcessGuid = '{0}' AND Hostname = '{1}') TO (SELECT FROM Sysmon Where ProcessGuid = '{2}' AND Hostname = '{3}')".format(e["ParentProcessGuid"],e['Hostname'],e["ProcessGuid"],e['Hostname'])
        try:
            client.command(edgecmd)
        except:
            print('likely no source vertex')