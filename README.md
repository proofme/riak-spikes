# riak-spikes
Test project to reproduce performance spikes occured with search agains DataType maps with many dynamic fields.
Reproduced on clean Riak installation, required setup scripts included.

## Setup:
```
./setup0.sh
npm install 
node gen-data.js 
```


## Run tests 

### Option 1. Node  script, official node library.

#### Run
```
node test.js  
```
#### Interpret results

During run this scripts produce output like this: 
```
[===                                     ] 8% 349.2s    39411 of 500000
 Thu Sep 17 2015 18:08:19 GMT+0300 (MSK)                Thu Sep 17 2015 18:08:26 GMT+0300 (MSK) Slow query 6489

 Thu Sep 17 2015 18:08:19 GMT+0300 (MSK)                Thu Sep 17 2015 18:08:26 GMT+0300 (MSK) Slow query 6490

 Thu Sep 17 2015 18:08:19 GMT+0300 (MSK)                Thu Sep 17 2015 18:08:26 GMT+0300 (MSK) Slow query 6490

 Thu Sep 17 2015 18:08:19 GMT+0300 (MSK)                Thu Sep 17 2015 18:08:26 GMT+0300 (MSK) Slow query 6488

 Thu Sep 17 2015 18:08:19 GMT+0300 (MSK)                Thu Sep 17 2015 18:08:26 GMT+0300 (MSK) Slow query 6488
 [===                                     ] 8% 349.2s    39420 of 500000
 Thu Sep 17 2015 18:08:19 GMT+0300 (MSK)                Thu Sep 17 2015 18:08:26 GMT+0300 (MSK) Slow query 6494

 Thu Sep 17 2015 18:08:19 GMT+0300 (MSK)                Thu Sep 17 2015 18:08:26 GMT+0300 (MSK) Slow query 6494

 Thu Sep 17 2015 18:08:19 GMT+0300 (MSK)                Thu Sep 17 2015 18:08:26 GMT+0300 (MSK) Slow query 6491

 Thu Sep 17 2015 18:08:19 GMT+0300 (MSK)                Thu Sep 17 2015 18:08:26 GMT+0300 (MSK) Slow query 6491
 [==========                              ] 24% 286.6s    122008 of 500000

```

and finally print result 

```
Done,  total: 100000 failed: 0, slow: 9, 
 Times:   min 2,  max  6041,   avg: 12.98176 
```

Such output appears with some periodics, 30 - 60 sec usually.


### Option 2. Apache Bench ( eliminating possible node.js  issues )

#### Run ( need apache-utils and gnuplot to be installed )
```
./test.sh
```
#### Interpret results

As result it is produce  timeseries.jpg    file  that looks like 
![Plot](https://www.dropbox.com/s/irybwreyyklsgdk/timeseries.jpg?dl=1)
And you can visually see  that long responses happens with some periodics

## Conclusion
#### My understanding of situation:
* In this test submap have unique keys, Riak when create SOLR document map it to plain structure  where each key  produce new filed `{KEY}_map.some_register`
* So Total number of unique fields for indexing is growing in geometry progression. 
* `10 root objects contains map with 10 unique submap keys, each contains 3 _registers =  300 unique field for indexing`

 
#### Problems
* Why  it happens periodicaly when I don't touch this index at all( test script search by second index that is empty )
* Propably this issue should  be documented in section http://docs.basho.com/riak/latest/dev/search/search-data-types/ since there is very easy to come in this situation using both Maps&Search








