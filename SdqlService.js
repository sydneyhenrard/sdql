var rp = require('request-promise-native');
var qs = require('querystring');
var util = require('util');
var vm = require('vm');
var _ = require('lodash');
var ss = require('simple-statistics');

class SdqlService {

	constructor(sdqlKey = 'GUEST') {
		this.sdqlKey = sdqlKey;
		this.ats = {
			NBA: true,
			NFL: true
		};
		this.scoringAttributes = {
			MLB: 'runs',
			NHL: 'goals',
			NFL: 'points',
			NBA: 'points'
		};
		this.defaultOdd = {
			value: -110,
			type: 'US'
		};
	}

	run(query, sport, ...breakdowns) {
		try {
			this._checkQuery(query);
		} catch(e) {
			return Promise.reject(e);
		}
		let url = this._buildUrl(query, sport, breakdowns);
		var options = {
			uri: url,
			json: true
		};
		return rp(options)
			.then(response => {
				let jsonpSandbox = vm.createContext({
					json_callback: function (r) {
						return r;
					}
				});
				let data = vm.runInContext(response, jsonpSandbox);
				let isATS = this._isATS(sport);
				let picks = [];
				data.groups.forEach(group => {
					let count = group.columns[0].length;
					for (let i = 0; i < count; i++) {
						let pick = {
							date: group.columns[0][i],
							team: group.columns[1][i],
							opponent: group.columns[2][i],
							site: group.columns[5][i] === 'home' ? 'H' : 'A',
							suMargin: group.columns[8][i],
							ouMargin: group.columns[9][i]
						};
						if (isATS) {
							pick.atsMargin = group.columns[10][i];
						} else {
							pick.odd = {
								value: group.columns[6][i],
								type: 'US'
							};
							pick.opponentOdd = {
								value: group.columns[7][i],
								type: 'US'
							};
						}
						if (breakdowns.length > 0) {
							let offset = isATS ? 11 : 10;
							for (let j = 0; j < breakdowns.length; j++) {
								let index = offset + j;
								pick[data.headers[index]] = group.columns[index][i];
							}
						}
						picks.push(pick);
					}
				});
				let system = {
					query: query,
					sport: sport,
					picks: picks
				};
				return Promise.resolve(system);
			});
	}

	_checkQuery(query) {
		if(query.indexOf(',') !== -1) {
			throw new Error('Query with comma delimited grouping is not supported');
		}
	}

	_buildUrl(query, sport, breakdowns) {
		let urlPrefix = util.format('http://api.sportsdatabase.com/%s/query.json?sdql=', sport.toLowerCase());
		let urlQuery;
		let scoringAttribute = this.scoringAttributes[sport];
		let isATS = this._isATS(sport);
		if (isATS) {
			urlQuery = util.format('date,team,o:team,%s,o:%s,site,line,o:line,margin,ou margin,ats margin', scoringAttribute, scoringAttribute);
		} else {
			urlQuery = util.format("date,team,o:team,%s,o:%s,site,line,o:line,margin,ou margin", scoringAttribute, scoringAttribute);
		}
		if (breakdowns.length > 0) {
			urlQuery = util.format('%s,%s', urlQuery, breakdowns.join());
		}
		urlQuery = util.format('%s@%s', urlQuery, query);
		return util.format('%s%s&output=json&api_key=%s', urlPrefix, qs.escape(urlQuery), this.sdqlKey);
	}

	_isATS(sport) {
		return this.ats[sport] != null;
	}

	analyze(system, type, includePicks, breakdown, overrideOdd) {
		let isATS = this._isATS(system.sport);
		let picksByBreakdown = breakdown != null ? _.groupBy(system.picks, breakdown) : {all: system.picks};
		let breakdownSummaries = [];
		for (let key of Object.keys(picksByBreakdown)) {
			let breakdownSummary = this._getPicksSummary(picksByBreakdown[key], type, isATS, key, overrideOdd);
			breakdownSummaries.push(breakdownSummary);
		}
		let summary = this._getSummary(breakdownSummaries, system.query);
		summary.type = type;
		if (breakdown != null) {
			system.breakdown = {
				by: breakdown,
				values: breakdownSummaries
			};
		}
		system.summary = summary;
		if (!includePicks) {
			delete system.picks;
		}
		return Promise.resolve(system);
	}

	_getPicksSummary(picks, type, isATS, breakdownValue, overrideOdd) {
		let picksByDate = _.groupBy(picks, 'date');
		let dates = Object.keys(picksByDate).sort();
		let daySummaries = [];
		for (let date of dates) {
			let daySummary = this._getDaySummary(picksByDate[date], type, isATS, overrideOdd);
			daySummaries.push(daySummary);
		}
		return this._getBreakdownSummary(daySummaries, breakdownValue);
	}

	_getDaySummary(picks, type, isATS, overrideOdd) {
		return _.reduce(picks, (result, value) => {
			result.count++;
			result.return += this._getProfit(value, type, isATS, overrideOdd);
			result.sumOdd += this._getOdd(type, value.odd, value.opponentOdd, overrideOdd).value;
			return result;
		}, {count: 0, return: 0, sumOdd: 0});
	}

	_getBreakdownSummary(daySummaries, breakdownValue) {
		let breakdownSummary = _.reduce(daySummaries, (result, value) => {
			result.count += value.count;
			result.return += value.return;
			result.min = Math.min(result.min, result.return);
			result.max = Math.max(result.max, result.return);
			result.sumOdd += value.sumOdd;
			if (value.return > 0) {
				result.positiveStreak++;
				result.negativeStreak = 0;
			} else if (value.return < 0) {
				result.negativeStreak++;
				result.positiveStreak = 0;
			}
			result.maxPositiveStreak = Math.max(result.maxPositiveStreak, result.positiveStreak);
			result.maxNegativeStreak = Math.max(result.maxNegativeStreak, result.negativeStreak);
			return result;
		}, {
			count: 0,
			return: 0,
			min: 1000,
			max: -1000,
			sumOdd: 0,
			positiveStreak: 0,
			negativeStreak: 0,
			maxPositiveStreak: 0,
			maxNegativeStreak: 0
		});
		breakdownSummary.breakdownValue = breakdownValue;
		breakdownSummary.yield = breakdownSummary.return / breakdownSummary.count;
		breakdownSummary.averageOdd = breakdownSummary.sumOdd / breakdownSummary.count;
		delete breakdownSummary.sumOdd;
		delete breakdownSummary.positiveStreak;
		delete breakdownSummary.negativeStreak;
		return breakdownSummary;
	}

	_getProfit(pick, type, isATS, overrideOdd) {
		let profit = 0;
		if (type === 'ON' || type === 'AGAINST') {
			let margin = isATS ? pick.atsMargin : pick.suMargin;
			if (type === 'ON') {
				if (margin > 0) {
					profit = this._getOdd(type, pick.odd, pick.opponentOdd, overrideOdd).value - 1;
				} else if (margin < 0) {
					profit = -1;
				}
			} else if (type === 'AGAINST') {
				if (margin < 0) {
					profit = this._getOdd(type, pick.odd, pick.opponentOdd, overrideOdd).value - 1;
				} else if (margin > 0) {
					profit = -1;
				}
			}
		} else if (type === 'OVER' || type === 'UNDER') {
			let margin = pick.ouMargin;
			if (type === 'OVER') {
				if (margin > 0) {
					profit = this._getOdd(type, pick.odd, pick.opponentOdd, overrideOdd).value - 1;
				} else if (margin < 0) {
					profit = -1;
				}
			} else if (type === 'UNDER') {
				if (margin < 0) {
					profit = this._getOdd(type, pick.odd, pick.opponentOdd, overrideOdd).value - 1;
				} else if (margin > 0) {
					profit = -1;
				}
			}
		}
		return profit;
	}

	_getOdd(type, odd, opponentOdd, overrideOdd) {
		let actualOdd;
		if (type === 'ON') {
			actualOdd = odd;
		} else if (type === 'AGAINST') {
			actualOdd = opponentOdd;
		}
		if (actualOdd == null) {
			if (overrideOdd != null) {
				actualOdd = overrideOdd;
			} else {
				actualOdd = this.defaultOdd;
			}
		}
		if (actualOdd.type === 'US') {
			let convertedOdd = {
				value: 0,
				type: 'DECIMAL'
			};
			if (actualOdd.value < 0) {
				convertedOdd.value = -100 / actualOdd.value + 1;
			} else {
				convertedOdd.value = actualOdd.value / 100 + 1;
			}
			actualOdd = convertedOdd;
		}
		return actualOdd;
	}

	_getSummary(breakdownSummaries, query) {
		let summary = {
			count: _.meanBy(breakdownSummaries, 'count'),
			return: _.meanBy(breakdownSummaries, 'return'),
			minBankroll: _.minBy(breakdownSummaries, 'min').min,
			worstReturn: _.minBy(breakdownSummaries, 'return').return,
			bestReturn: _.maxBy(breakdownSummaries, 'return').return,
			losingSeason: _.filter(breakdownSummaries, breakdownSummary => {
				return breakdownSummary.return < 0
			}).length
		};
		summary.averageOdd = _.reduce(breakdownSummaries, (result, value) => {
			result.sumOdd += value.count * value.averageOdd;
			result.sumCount += value.count;
			result.averageOdd = result.sumOdd / result.sumCount;
			return result;
		}, {sumCount: 0, sumOdd: 0, averageOdd: 0}).averageOdd;
		summary.yield = summary.return / summary.count;
		summary.returnSharpeRatio = summary.return / ss.standardDeviation(_.map(breakdownSummaries, 'return'));
		summary.countSharpeRatio = summary.count / ss.standardDeviation(_.map(breakdownSummaries, 'count'));
		summary.countParameters = query.split("and").length;
		return summary;
	}

}

module.exports = SdqlService;
