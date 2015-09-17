#!/bin/bash
sudo riak-admin bucket-type create maps '{"props":{"datatype":"map"}}'
sudo riak-admin bucket-type activate maps

sudo riak-admin bucket-type create generic
sudo riak-admin bucket-type activate generic


export RIAK_HOST="http://localhost:8098"

curl -XPUT $RIAK_HOST/search/index/index1
curl -XPUT $RIAK_HOST/search/index/index2

curl -XPUT $RIAK_HOST/types/maps/buckets/fill/props \
     -H 'Content-Type: application/json' \
     -d '{"props":{"search_index":"index1"}}'

curl -XPUT $RIAK_HOST/types/generic/buckets/search/props \
     -H 'Content-Type: application/json' \
     -d '{"props":{"search_index":"index2"}}'

