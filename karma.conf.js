/*
 * angular-here-address-autocomplete
 *
 * Copyright (c) 2015 QNX Software Systems Limited
 * Licensed under the MIT license.
 * https://github.com/DotLinker/angular-here-address-autocomplete/blob/master/LICENSE
 */
 
'use strict';

module.exports = function (config) {
	config.set({
		basePath: '',
		frameworks: ['jasmine'],
		logLevel: 'INFO',
		browsers: ['PhantomJS'],
		autoWatch: true,
		reporters: ['progress', 'coverage'],
		files: [
			'http://js.api.here.com/v3/3.0/mapsjs-core.js',
			'http://js.api.here.com/v3/3.0/mapsjs-service.js',
			'bower_components/angular/angular.js',
			'bower_components/angular-mocks/angular-mocks.js',
			'src/**/*.js',
			'test/**/*.js'
		],
		preprocessors: {
			'src/**/*.js': 'coverage'
		},
		coverageReporter: {
			type: 'html',
			dir: 'coverage/'
		}
	});
};
