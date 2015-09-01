/*
 * angular-here-address-autocomplete
 *
 * Copyright (c) 2015 QNX Software Systems Limited
 * Licensed under the MIT license.
 * https://github.com/DotLinker/angular-here-address-autocomplete/blob/master/LICENSE
 */

'use strict';

module.exports = function (grunt) {
	// Load grunt tasks automatically
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		karma: {
			unit: {
				configFile: 'karma.conf.js',
				singleRun: true
			}
		},
		clean: {
			dist: { src: 'dist', dot: true },
            lib: { src: 'example/lib', dot: true },
			bower: { src: 'bower_components', dot: true }
		},
		bower: { 
			install: { options: { targetDir: 'example/lib' } } 
		},
        cssmin: {
            dist: {
                expand: true,
                cwd: 'dist/',
                files: {
                    'dist/autocomplete.min.css': 'src/autocomplete.css'
                }
            }
        },
		uglify: {
			dist: {
				files: {
					'dist/autocomplete.min.js': 'src/autocomplete.js'
				}
			}
		}
	});

	grunt.registerTask('test', [
		'karma'
	]);

	grunt.registerTask('build', [
		'clean',
		'bower',
        'cssmin',
		'uglify'
	]);

	grunt.registerTask('default', ['build']);
};
