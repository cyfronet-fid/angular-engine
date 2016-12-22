/**
 * This grunt task is specified only for creating documentation
 *
 * Documentation is generated using [grunt-ngdocs](https://github.com/m7r/grunt-ngdocs)
 * As of now dgeni seems to be the most modern way of documenting angular, but it is
 * extremaly poorly documented and does not provide any out of the box templates
 * for generating fast documentation for projects which can not afford to build
 * documentation app from ground up.
 *
 * Until this state of things changes this project will be documented using grunt-ngdocs
 *
 */

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-ngdocs');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.initConfig({
        ngdocs: {
            options: {
                dest: 'build/<%= pkg.version %>',
                startPage: '/public',
                title: 'Angular Engine integration',
                scripts: ['docs/js/vendor.js',
                          'angular-engine.js'],
                html5Mode: false,
                template: 'docs/templates/index.tpl.html',
                navTemplate: 'docs/templates/navbar.tpl.html',
                deferLoad: false,
            },
            public: {
                src: ['src/engine.provider.js', 'docs/content/api/**.ngdoc'],
                title: 'Public API',
                api: false
            },
            developer: {
                src: ['docs/content/developer/**.ngdoc', 'src/**.js'],
                title: 'Developer Guide',
                api: true
            }
        },
        pkg: grunt.file.readJSON('bower.json'),
        clean: ['build']
    });

    grunt.registerTask('default', ['clean', 'ngdocs']);

};