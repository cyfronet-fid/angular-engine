var fs = require('fs');
var deasync = require('deasync');
var cp = require('child_process');
var exec = deasync(cp.exec);


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
                'docs/js/vendor.js': /^bower_components/
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
            'node_modules/.bin/grunt ngdocs > /dev/null'
        ],
        angularTemplate: {
            moduleName: 'engine',
            pathToSrc: function(x) { return '/'+x },
            jadeOptions: {},
            ignore: ['docs/templates/src/index.tpl.html', 'docs/templates/src/navbar.tpl.html']
        },
        replacement: {
            replacements: [{
                files: [/\.js$/, /\.js\.in$/, /\.tpl\.html$/],
                matches: [
                    {
                        find: '@@__DATE__',
                        replace: (new Date()).toISOString()
                    },
                    {
                        find: '@@__GIT_TAGS__',
                        replace: function(){
                            var documentation_from = JSON.parse(fs.readFileSync('metadata.json', 'utf8')).documentation_from;
                            var documentation_started = false;

                            var tags = exec('git tag -l --sort=v:refname').split('\n');

                            var ret = [];

                            for(var i=0; i<tags.length; ++i){
                                var tag = tags[i];

                                if(tag == '' || tag.charAt(0) != 'v')
                                    continue;

                                tag = tag.slice(1);
                                if(!documentation_started) {
                                    if(documentation_from == tag)
                                        documentation_started = true;
                                    else
                                        continue;
                                }
                                ret.push(tag);
                            }
                            return ret.join('|');
                        }()
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
