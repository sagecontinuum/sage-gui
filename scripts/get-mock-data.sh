#!/bin/bash

if [ -z "$1" ]  ; then
    echo "./transform-data.sh [oputput]"
    echo "    output: output path for tranformed json file"
    exit 1
fi

IN_FILE=test-data/manifest.csv
OUT_FILE=$1


echo "fetching csv..."
TEMP_DIR=temp-node-production
git clone -n https://github.com/waggle-sensor/node_production $TEMP_DIR --depth 1
cd $TEMP_DIR
git checkout HEAD sageblades/manifest.csv
cd ..
mkdir -p test-data/
cp  $TEMP_DIR/sageblades/manifest.csv $IN_FILE

echo "cleaning up ./$TEMP_DIR"
rm -r $TEMP_DIR


HEADER="VSN,name,status,rSSH,node_id,iDRAC_IP,iDRAC_Port,eno1_address,eno2_address,provision_date,os_version,service_tag,special_devices,bios_version,lat,lng,location,contact,notes"

echo "transforming $IN_FILE ..."
sed -i.bak "1 s/^.*$/$HEADER/" "$IN_FILE"

echo "created-backup: $IN_FILE.bak"
echo "transformed: $IN_FILE"


./node_modules/csvtojson/bin/csvtojson "$IN_FILE" > "$OUT_FILE"
echo "created json: $OUT_FILE"
