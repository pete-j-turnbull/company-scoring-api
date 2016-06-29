var async = require('asyncawait/async');
var await = require('asyncawait/await');
var koa = require('koa');
var router = require('koa-router')();
var Promise = require('bluebird');
var log = require('./utilities/logger');
var koaLogger = require('./utilities/koa-logger');
var config = require('./config/config');
var routes = require('./routes');


var app = koa();

router.get('/scoreCompany', routes.scoreCompany);


app.use(koaLogger());
app.use(router.routes());


async (function () {
	//await (mongo.init());

	app.listen(config.port, function () {
		log.info('Server running on port: ' + config.port + '.');
	});
})();