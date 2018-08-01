#!/bin/bash
# Other scripts use this default password. Change the rest if you change the default
export ORIENTDB_ROOT_PASSWORD=Password1234
export ORIENTDB_HOME=`pwd`
wget https://s3.us-east-2.amazonaws.com/orientdb3/releases/3.0.4/orientdb-3.0.4.tar.gz
wget https://github.com/jymcheong/SysmonResources/raw/master/5.%20Threat%20Analytics/orientDB/schema_and_functions.gz
tar zxvf orientdb-3.0.4.tar.gz 
orientdb-3.0.4/bin/server.sh &
orientdb-3.0.4/bin/console.sh "create database remote:localhost\DataFusion root $ORIENTDB_ROOT_PASSWORD; import database schema_and_functions.gz;"
