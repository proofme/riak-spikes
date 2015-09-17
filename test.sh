ab -n 500000 -c 20 -g res.tsv "http://127.0.0.1:8098/search/query/index2?q=*:*"
gnuplot plot
