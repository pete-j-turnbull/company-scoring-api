var async = require('asyncawait/async');
var await = require('asyncawait/await');
var _ = require('lodash');
var request = require('co-request');
var log = require('./utilities/logger');
var config = require('./config/config');
var objectAssign = require('object-assign');


var _score = function (companyProfile) {
	log.info(companyProfile);
	var weights = [0, 0, 0, 0, 0, 0, 0, 0, 0];

	return 10 - (
		weights[0] * companyProfile.undeliverable_registered_office_address +
		weights[1] * companyProfile.accounts.overdue +
		weights[2] * companyProfile.has_been_liquidated +
		weights[3] * companyProfile.annual_return.overdue +
		weights[4] * companyProfile.has_insolvency_history +
		weights[5] * (companyProfile.status == 'active') +
		weights[6] * companyProfile.has_insolvency_history +
		weights[7] * companyProfile.has_charges +
		weights[8] * companyProfile.can_file );

	//weights[0] * companyProfile.type +
	//TODO: incorp officers information


	return 10;
}

module.exports.scoreCompany = function *() {
	var companyNumber = this.query.company_number;
	var companyName = this.query.company_name;

	var baseOptions = {
		headers: {
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36'
		},
		auth: {
			'user': config.chApiKey
		}
	};

	if (companyNumber) {
		// We have a companyNumber
		var opts = objectAssign({}, baseOptions, { url: 'https://api.companieshouse.gov.uk/company/' + companyNumber });
		var companyResp = yield request(opts);
		var companyProfile = JSON.parse(companyResp.body);

		// Now score the company with the data at hand. TODO
		var score = _score(companyProfile);
		var response = { success: true, result: { companyNumber: companyProfile.company_number, score: score }};
		this.body = response;

	} else if (companyName) {
		// We have a company name to search on
		var opts = objectAssign({}, baseOptions, { url: 'https://api.companieshouse.gov.uk/search/companies/?q=' + companyName });
		var searchResp = yield request(opts);
		var searchResults = JSON.parse(searchResp.body);

		// For now choose the first company in search results
		if (searchResults.total_results > 0) {
			var companyProfile = searchResults.items[0]
			// Now score the company with the data at hand. TODO
			var score = _score(companyProfile);
			var response = { success: true, result: { companyNumber: companyProfile.company_number, score: score }};
			this.body = response;

		} else {
			var response = { success: false, result: 'No companies found with that name.' };
			this.body = response;
		}

	} else {
		var response = { success: false, result: 'No company_number or company_name supplied.' };
		this.body = response;
	}


	/*
	var options = {
		url: 'https://api.companieshouse.gov.uk/company/' + '04647910',
		headers: {
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36'
		},
		auth: {
			'user': 'ZsgCqaqCZSMA7CZK3ovuNrEqy06ktpcX5P_WLP5g'
		}
	};

	var options = {
		url: 'https://api.companieshouse.gov.uk/search/companies?q=' + 'anyclean',
		headers: {
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36'
		},
		auth: {
			'user': 'ZsgCqaqCZSMA7CZK3ovuNrEqy06ktpcX5P_WLP5g'
		}
	};

	var resp = yield request(options);
	var response = { success: true, result: resp.body };
	this.body = response;
	*/
}

	