# SDQL [![Build Status](https://travis-ci.org/sydneyhenrard/sdql.svg?branch=master)](https://travis-ci.org/sydneyhenrard/sdql)

A Node.js module to query and analyze SDQL query

## Installation

```
npm install sdql --save
```

## Usage

The sample program checks the performance of betting on home underdog in the NFL breakdowned by season:

```javascript
var SdqlService = require('./SdqlService');

let sdqlService = new SdqlService();
let breakdown = 'season';
sdqlService.run('HD', 'NFL', breakdown)
.then(system => {
	return sdqlService.analyze(system, 'ON', false, breakdown);
})
.then(analysis => {
	console.log(analysis)
});
```

The `analyze` method parameters:

`system`: data returned by the `run` method call

`type`:
 - `ON`: Follow the system
 - `AGAINST`: Fade the system
 - `OVER`: Play on the over
 - `UNDER`: Play on the under

`includePicks`: include all the picks in the analysis

`breakdown`: breakdown the picks by that parameter. For instance setting the parameter to `season` will return the performance by season.
Note that you have to specify the breakdown in both the `run` and `analysis`
 methods.
 
### Options

By default the odds is -110, but you can override the odd. It's useful to compare the performance of a query with a lower juice (-105).

```javascript
sdqlService.analyze(system, 'ON', false, breakdown, {value: -105, type: 'US'});
```

## Tests

```
npm test
```


