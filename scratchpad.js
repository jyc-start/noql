const SQLParser=require('./lib/SQLParser');

let parsedVal=SQLParser.makeMongoQuery("select * from `films` where arraySize(Rentals)>10 and arraySize(Rentals)<90")
//let parsedVal=SQLParser.makeMongoQuery("select (log10(3) * floor(a) +1) as s from collection")
let x;

