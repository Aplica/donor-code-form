var express = require('express');
var router = express.Router();

var Parse = require('parse/node');
Parse.initialize(process.env.PARSE_APP_ID, '', process.env.PARSE_MASTER_KEY);
Parse.Cloud.useMasterKey();
Parse.serverURL = 'https://donor-parse-server.herokuapp.com/parse';

router.get('/', function(req, res, next) {
	var userId = req.query.userId || '';

	res.render('index', { userId: userId });
});

var writeJsonResponse = function(response, data) {
	response.writeHead(200, {"Content-Type": "application/json"});
	var json = JSON.stringify(data);
	response.end(json);
};

var errorFn = function(res) {
	writeJsonResponse(res, {
		success: false,
		message: 'Произошла ошибка, попробуйте еще раз'
	});
};

router.post('/code', function(req, res, next) {
	if (!req || !req.body) {
		return errorFn(res);
	}

	var userId = req.body.userId;
	if (!userId) {
		return errorFn(res);
	}

	var code = req.body.code;
	if (!code || !(code.length === 16 || code.length === 20)) {
		return errorFn(res);
	}

	var query = new Parse.Query(Parse.User);
	query.get(userId);
	query.find({
		success: function(result) {
			console.log(result);

			if (result.length === 1) {
				var user = result[0];
				if (user) {
					user.set('code', code);
					user.save(null, {
						success: function (u) {
							writeJsonResponse(res, {
								success: true,
								message: 'Код донации успешно сохранен!',
								redirectUrl: 'yadonor://'
							});
						},
						error: function (u, error) {
							errorFn(res);
						}
					});
					return;
				}
			}

			return errorFn(res);
		},
		error: function(result) {
			console.log(result);
			return errorFn(res);
		}
	});
});

module.exports = router;
