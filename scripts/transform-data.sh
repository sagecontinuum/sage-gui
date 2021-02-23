#!/bin/bash

if [ -z "$1" ] || [ -z "$2" ] ; then
    echo "./transform-data.sh [input] [oputput]"
    echo "    input: path to csv file"
    echo "    output: output path for tranformed json file"
    exit 1
fi

IN_FILE=$1
OUT_FILE=$2

HEADER="VSN,name,status,rSSH,node_id,iDRAC_IP,iDRAC_Port,eno1_address,eno2_address,provision_date,os_version,service_tag,special_devices,bios_version,lat,lng,location,contact,notes"

echo "transforming $IN_FILE ..."

sed -i.bak "1 s/^.*$/$HEADER/" "$IN_FILE"
echo "created-backup: $IN_FILE.bak"
echo "transformed: $IN_FILE"

./node_modules/csvtojson/bin/csvtojson "$IN_FILE" > "$OUT_FILE"
echo "created json: $OUT_FILE"
