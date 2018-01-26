# Data Forwarding
Beyond analysing on a single machine, we will need to forward Sysmon Events to a central log ingestion system since logs staying silo'ed in each host is rather pointless:

* [https://github.com/palantir/windows-event-forwarding](https://github.com/palantir/windows-event-forwarding) Over the past few years, Palantir has a maintained an internal Windows Event Forwarding (WEF) pipeline for generating and centrally collecting logs of forensic and security value from Microsoft Windows hosts. Once these events are collected and indexed, alerting and detection strategies (ADS) can be constructed not only on high-fidelity security events (e.g. log deletion), but also for deviations from normalcy, such as unusual service account access, access to sensitive filesystem or registry locations, or installation of malware persistence...

Once these events get into the centralised **W**indows **E**vent **C**ollector server(s), we will want to forward them to a **S**ecurity **I**ncident **E**vent **M**anagement or [ElasticSearch](https://www.elastic.co) based systems (eg. [ELK stack](https://www.elastic.co/products), [Graylog](https://www.graylog.org)...). To do so, we need software agents installed into the WECs:

* [Beats](https://www.elastic.co/products/beats) is the platform for single-purpose data shippers. They install as lightweight agents and send data from hundreds or thousands of machines to Logstash or Elasticsearch.

* [NXlog CE](https://nxlog.co/products/nxlog-community-edition) NXLog Community Edition is an open source, high-performance, multi-platform log management solution aimed at solving these tasks and doing it all in one place. [Sample configuration to send Windows Events to ElasticSearch/Graylog with NXlog CE.](https://medium.com/@jym/collecting-windows-events-including-sysmon-2-with-nxlog-ce-graylog-881ccf3db314)

Some may also opt to do away with Windows Event Forwarding altogether & use these agents to forward directly to a centralised log management & analysis backend. The subsequent links are a subset related to specific infra/products from [https://github.com/MHaggis/sysmon-dfir](https://github.com/MHaggis/sysmon-dfir):

* Graylog
	* [Ion-Storm Graylog App](https://github.com/ion-storm/sysmon-config)
	* [Back to Basics- Enhance Windows Security with Sysmon and Graylog - Jan Dobersten](https://www.graylog.org/blog/83-back-to-basics-enhance-windows-security-with-sysmon-and-graylog)

* ELK
	* [Building a Sysmon Dashboard with an ELK Stack - Roberto Rodriguez](https://cyberwardog.blogspot.com/2017/03/building-sysmon-dashboard-with-elk-stack.html)
	* [How To Do Endpoint Monitoring on a Shoestring Budget – Webcast Write-Up](https://www.blackhillsinfosec.com/endpoint-monitoring-shoestring-budget-webcast-write/)
* Neo4j
	* [Sysmon and Neo4j - Andy(malwaresoup)](https://www.malwaresoup.com/sysmon-and-neo4j/)

* Splunk
	* [Sysmon App for Splunk - @Jarrettp & @MHaggis](https://splunkbase.splunk.com/app/3544/)
	* [Sysmon-Threat-Intel - App - Jarrett Polcari @jarrettp](https://github.com/kidcrash22/Sysmon-Threat-Intel)
	* [Splunk App to assist Sysmon Threat Hunting - Mike Haag](https://github.com/MHaggis/app_splunk_sysmon_hunter)
	* [Splunking the Endpoint - Files from presentation - James Brodsky & Dimitri McKay](https://splunk.app.box.com/v/splunking-the-endpoint)

* RSA Netwitness
	* [Log - Sysmon 6 Windows Event Collection - Eric Partington](https://community.rsa.com/community/products/netwitness/blog/authors/15EMaWGl7WJv0wnUDkDEBWb0qgWxB1SoVqC6uE9UbG8%3D)
