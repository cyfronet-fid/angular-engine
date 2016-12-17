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
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-string-replace');

    grunt.initConfig({
        ngdocs: {
            options: {
                dest: 'build',
                startPage: '/public',
                title: 'Angular Engine integration',
                scripts: ['docs/js/engine.docs.js'],
                html5Mode: false,
                template: 'docs/templates/index.tpl.html',
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
        'string-replace': {
            version: {
                files: {
                    'src/engine.version.js': 'src/engine.version.js.in',
                    'docs/js/engine.docs.js': 'docs/js/engine.docs.js.in'
                },
                options: {
                    replacements: [{
                        pattern: /@@__ENGINE_VERSION__/g,
                        replacement: '<%= pkg.version %>'
                    },
                        {
                        pattern: /@@__ENGINE_BACKEND_VERSION__/g,
                        replacement: '<%= metadata.engine_version %>'
                    }]
                }
            }
        },
        pkg: grunt.file.readJSON('bower.json'),
        metadata: grunt.file.readJSON('metadata.json'),
        connect: {
            options: {
                keepalive: true
            },
            server: {}
        },
        clean: ['build']
    });

    grunt.registerTask('default', ['clean', 'string-replace', 'ngdocs', 'connect']);

};