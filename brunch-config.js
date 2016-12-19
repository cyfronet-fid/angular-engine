var fs = require('fs');

module.exports = {
    paths: {
        public: '',
        watched: ['src', 'docs/js/src', 'docs/content', 'docs/templates']
    },
    modules: {
        definition: false,
        wrapper: false
    },
    npm: {
        enabled: false
    },
    files: {
        templates: {
            joinTo: {
                'src/templates.js': /^src/
            }
        },
        javascripts: {
            joinTo: {
                'angular-engine.js': ['src/**.js', 'src/templates.js'],
                'docs/js/engine.docs.js': ['docs/js/src/**.js'],
                'docs/js/vendor.js': /^(bower_components)/
            },
            order: {
                before: [
                    'src/**.module.js'
                ]
            }
        }
    },
    conventions: {
        ignored: ['node_modules/**']
    },
    plugins: {
        afterBrunch: [
            'grunt ngdocs > /dev/null'
        ],
        angularTemplate: {
            moduleName: 'engine',
            pathToSrc: function(x) { return '/'+x },
            jadeOptions: {},
            ignore: []
        },
        replacement: {
            replacements: [{
                files: [/\.js$/, /\.js\.in$/],
                matches: [
                    {
                        find: '@@__DATE__',
                        replace: (new Date()).toISOString(),
                    },
                    {
                        find: '@@__ENGINE_VERSION__',
                        replace: JSON.parse(fs.readFileSync('bower.json', 'utf8')).version
                    },
                    {
                        find: '@@__ENGINE_BACKEND_VERSION__',
                        replace: JSON.parse(fs.readFileSync('metadata.json', 'utf8')).engine_version
                    }
                ]
            }]
        }
    }
};
