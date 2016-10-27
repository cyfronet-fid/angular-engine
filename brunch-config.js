module.exports = {
    paths: {
        public: '',
        watched: ['src']
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
                'angular-engine.js': 'src/**!(.spec).js',
            },
            order: {
                before: [
                    'src/**.module.js'
                ]
            }
        },
    },
    conventions: {
        ignored: []
    },
    plugins: {
        //babel: {presets: ['es2015']},
        //ng_annotate: {
        //    pattern: /^src\/main\/resources\/static\/js/
        //}
        // ng_templates: {
        //     module: 'engine.templates'
        // },
        angularTemplate: {
            moduleName: 'engine',
            pathToSrc: function(x) { return x },
            jadeOptions: {},
            ignore: []
        }
    }
};
