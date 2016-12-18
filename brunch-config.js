var fs = require('fs');

module.exports = {
    paths: {
        public: '',
        watched: ['src', 'docs/js/src']
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
                'docs/js/engine.docs.js': ['docs/js/src/**.js']
            },
            order: {
                before: [
                    'src/**.module.js'
                ]
            }
        }
    },
    conventions: {
        ignored: ['node_modules/**', 'bower_components/**']
    },
    plugins: {
        //babel: {presets: ['es2015']},
        //ng_annotate: {
        //    pattern: /^src\/main\/resources\/static\/js/
        //}
        // ng_templates: {
        //     module: 'engine.templates'
        // },
        afterBrunch: [
            'grunt clean > /dev/null',
            'grunt ngdocs > /dev/null'
        ],
        angularTemplate: {
            moduleName: 'engine',
            pathToSrc: function(x) { return '/'+x },
            jadeOptions: {},
            ignore: []
        },
        replace: {
            encoding: 'utf8',
            log: true,
            mapping: {
                'date': (new Date()).toISOString(),
                // '__ENGINE_VERSION__': JSON.parse(fs.readFileSync('bower.json', 'utf8')).version,
                // '__ENGINE_BACKEND_VERSION__': JSON.parse(fs.readFileSync('metadata.json', 'utf8')).engine_version
            },
            paths: [
                'src/engine.version.js',
                'docs/js/engine.docs.js.in'
            ],
            replacePrefix: '{!',
            replaceSuffix: '!}'
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
