var async = require('asyncawait/async');
var await = require('asyncawait/await');
var _ = require('lodash');
var request = require('co-request');
var log = require('./utilities/logger');
var config = require('./config/config');
var objectAssign = require('object-assign');


var _normalize = function (weights) {
	var sumWeights = _(weights).sum();
	var normalizer = 10 / sumWeights;

	var nWeights = _(weights)
		.map(function (weight) {
			return weight * normalizer
		})
		.value();
	return nWeights;
};
var _score = function (companyProfile) {
	log.info(companyProfile);

	var weights = [0.5, 1.5, 2, 1.5, 3, 3, 2, 0.5, 0.5];

	//normalize
	var nWeights = _normalize(weights)

	return 10 - (
		weights[0] * companyProfile.undeliverableRegisteredOfficeAddress +
		weights[1] * companyProfile.accountsOverdue +
		weights[2] * companyProfile.hasBeenLiquidated +
		weights[3] * companyProfile.annualReturnOverdue +
		weights[4] * companyProfile.inActive +
		weights[5] * companyProfile.hasInsolvencyHistory +
		weights[6] * companyProfile.hasCharges +
		weights[7] * !companyProfile.canFile +
		weights[8] * (companyProfile.resignedOfficerCount / companyProfile.activeOfficerCount)); // Probably not important but perhaps lots of officers resigning at once could be a red flag
}


var getOfficers = function *(baseOptions, companyNumber) {
	var opts = objectAssign({}, baseOptions, { url: 'https://api.companieshouse.gov.uk/company/' + companyNumber + '/officers' });
	var officersResp = yield request(opts);
	var officers = JSON.parse(officersResp.body);
	return officers;
};
var getCompanyInfo = function *(baseOptions, companyNumber) {
	var opts = objectAssign({}, baseOptions, { url: 'https://api.companieshouse.gov.uk/company/' + companyNumber });
	var companyInfoResp = yield request(opts);
	var companyInfo = JSON.parse(companyInfoResp.body);
	return companyInfo;
};
var buildCompanyProfile = function (companyInfo, officers) {
	var companyProfile = {
		undeliverableRegisteredOfficeAddress: companyInfo.undeliverable_registered_office_address,
		accountsOverdue: companyInfo.accounts.overdue,
		hasBeenLiquidated: companyInfo.has_been_liquidated,
		annualReturnOverdue: companyInfo.annual_return.overdue,
		inActive: companyInfo.status != 'active',
		hasInsolvencyHistory: companyInfo.has_insolvency_history,
		hasCharges: companyInfo.has_charges,
		canFile: companyInfo.can_file,
		resignedOfficerCount: officers.resigned_count,
		activeOfficerCount: officers.active_count
	};
	return companyProfile;
};

var getCompanyNumber = function *(baseOptions, companyName) {
	var opts = objectAssign({}, baseOptions, { url: 'https://api.companieshouse.gov.uk/search/companies/?q=' + companyName });
	var searchResp = yield request(opts);
	var searchResults = JSON.parse(searchResp.body);

	if (searchResults.total_results > 0) {
		var companyNumber = searchResults.items[0].company_number;
		return companyNumber;
	} else {
		throw new Error('No companies found with that name.');
	}
};


module.exports.scoreCompany = function *() {
	try {
		var companyNumber = this.query.companyNumber;
		var companyName = this.query.companyName;

		if (!companyNumber && !companyName) throw new Error('No company_number or company_name supplied.');

		var baseOptions = {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36'
			},
			auth: {
				'user': config.chApiKey
			}
		};

		if (!companyNumber) companyNumber = yield getCompanyNumber(baseOptions, companyName);

		// Now we have a company number

		var companyInfo = yield getCompanyInfo(baseOptions, companyNumber);
		var officers = yield getOfficers(baseOptions, companyNumber); // These queries need to be run in parallel with Promise.all

		var companyProfile = buildCompanyProfile(companyInfo, officers);
		var score = _score(companyProfile);

		var response = { success: true, result: { companyNumber: companyNumber, score: score }};
		this.body = response;



	} catch (err) {
		var response = { success: false, result: String(err) };
		this.body = response;
	}
}

	