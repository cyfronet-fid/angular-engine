module.exports = {
    paths: {
        public: '',
        watched: ['src', 'docs', 'Gruntfile.js']
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
                'angular-engine.js': ['src/**.js', 'src/templates.js']
            },
            order: {
                before: [
                    'src/**.module.js'
                ]
            }
        }
    },
    conventions: {
        ignored: ['node_modules/**', 'bower_components/**', 'src/engine.version.js.in', 'src/engine.version.js', 'docs/js/engine.docs.js.in', 'docs/js/engine.docs.js']
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
            // 'grunt ngdocs > /dev/null',
            // 'grunt string-replace'
        ],
        angularTemplate: {
            moduleName: 'engine',
            pathToSrc: function(x) { return '/'+x },
            jadeOptions: {},
            ignore: []
        }
    }
};
