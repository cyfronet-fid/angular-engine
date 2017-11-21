var fs = require('fs');
var deasync = require('deasync');
var cp = require('child_process');
var exec = deasync(cp.exec);
const _ = require('lodash');

var engine_docs = 'build/' + JSON.parse(fs.readFileSync('bower.json', 'utf8')).version + '/js/engine.docs.js';
var isWin = /^win/.test(process.platform);

var afterBuild = [];

if (!_.isUndefined(process.env['AFTER_BUILD'])) {
    afterBuild.push(process.env['AFTER_BUILD']);
}

module.exports = {
    paths: {
        public: '',
        watched: ['src', 'docs/js/src', 'docs/content', 'docs/templates', 'scss']
    },
    modules: {
        definition: false,
        wrapper: false
    },
    npm: {
        enabled: false
    },
    server: {
        command: 'node_modules/.bin/http-server . --ssl -a localhost -p 8000 -C cert.pem'
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

                // 'docs/js/vendor.js': /^bower_components/,
                'tests/e2e/vendor.js': /^bower_components/
            },
            order: {
                before: [
                    'src/**.module.js'
                ],
                after: [
                    'docs/js/src/init.js'
                ]
            }
        },
        stylesheets: {
            joinTo: {
                'angular-engine.css': ['scss/angular-engine.scss']
            }
        }
    },
    conventions: {
        ignored: ['node_modules/**']
    },
    plugins: {
        afterBrunch: _.concat([
            isWin ? 'node_modules\\.bin\\grunt ngdocs > nul' : 'node_modules/.bin/grunt ngdocs > /dev/null',
            // 'cp docs/js/docs.js build/'+JSON.parse(fs.readFileSync('bower.json', 'utf8')).version+'/js/docs.js',
            'cp bower_components/angular-animate/angular-animate.min.js build/' + JSON.parse(fs.readFileSync('bower.json', 'utf8')).version + '/js/angular-animate.min.js'
        ], afterBuild),
        angularTemplate: {
            moduleName: 'engine',
            pathToSrc: function (x) {
                return '/' + x
            },
            jadeOptions: {},
            ignore: ['docs/templates/src/index.tpl.html', 'docs/templates/src/navbar.tpl.html']
        },
        ngAnnotate: {
            // place config here
        },
        uglify: {
            mangle: false,
            compress: {
                global_defs: {
                    DEBUG: false
                }
            }
        },
        babel: {
            // bower components should already be usable
            // static/js is a non angular code, and also should not contain ecma6 syntax
            // for some reason after compiling with babel it does not work
            // TODO - check why src/main/resources/static/js does not compile with babel
            ignore: ['bower_components/**.js', 'node_modules/**.js'],
            presets: [['env', {
                targets: {
                    browsers: ['ie >= 8']
                }
            }]]
        },
        environment: {
            token: /@@__ENV__/g
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
                        replace: function () {
                            var documentation_from = JSON.parse(fs.readFileSync('metadata.json', 'utf8')).documentation_from;
                            var documentation_started = false;

                            var tags = exec('git tag -l --sort=v:refname').split('\n');

                            var ret = [];

                            for (var i = 0; i < tags.length; ++i) {
                                var tag = tags[i];

                                if (tag == '' || tag.charAt(0) != 'v')
                                    continue;

                                tag = tag.slice(1);
                                if (!documentation_started) {
                                    if (documentation_from == tag)
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
module.exports.files.javascripts.joinTo[engine_docs] = ['docs/js/src/**.js'];