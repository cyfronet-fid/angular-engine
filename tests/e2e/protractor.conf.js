//jshint strict: false
exports.config = {

    allScriptsTimeout: 11000,
    specs: [
        '**.spec.js'
    ],

    capabilities: {
        'browserName': 'chrome'
    },

    baseUrl: 'http://localhost:8000/tests/e2e/',

    framework: 'jasmine',

    jasmineNodeOpts: {
        defaultTimeoutInterval: 30000
    }

};
