#!/bin/bash

if [ -z "$1" ]; then
    echo "./deploy.sh [ip_address]"
    echo "    ip_address: ip_address for deployment"
    exit 1
fi

npm run build
scp -r dist/ $1:~
