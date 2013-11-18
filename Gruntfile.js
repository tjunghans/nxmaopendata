'use strict';

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			source_vendor: {
				files : {
					'build/source.js' : [
						'src/javascript/namespace.js',
						'src/javascript/libraries/Lab.*.js',
						'src/javascript/modules/Tc.Module.*.js',
						'src/javascript/bootstrap.js'
					],
					'build/vendor.js' : [
						'src/javascript/vendor/jquery.js',
						'src/javascript/vendor/underscore-min.js',
						'src/javascript/vendor/doT.min.js',
						'src/javascript/vendor/moveabletype.latlong.js',
						'src/javascript/vendor/terrific-2.0.1.min.js',
						'src/javascript/vendor/knockout-2.3.0.js'
					]
				}
			},
			distribution : {
				files : {
					'build/<%= pkg.name %>.min.js' : [
						'build/vendor.js',
						'build/source.min.js'
					]
				}
			}
		},
  		uglify: {

			options: {
				preserveComments : 'some',
				strict : false,
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			build: {

				src: 'build/source.js',
				dest: 'build/source.min.js'

			}
		}
	});


	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.registerTask('default', ['concat:source_vendor', 'uglify', 'concat:distribution']);
};
