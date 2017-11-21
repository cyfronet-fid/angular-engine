//jshint strict: false
const staticServer = require('node-static');

exports.config = {
    onPrepare: function () {
        var file = new staticServer.Server('../../', {cache: 0});

        require('http').createServer(function (request, response) {
            request.addListener('end', function () {
                // Serve files!
                file.serve(request, response);
            }).resume();
        }).listen(8000);

    },
    allScriptsTimeout: 11000,
    specs: [
        '**.spec.js'
    ],

    capabilities: {
        'browserName': 'chrome'
    },

    baseUrl: process.env.ENG_TESTING_SERVER_URL || 'http://localhost:8000/tests/e2e/',

    framework: 'jasmine',

    jasmineNodeOpts: {
        defaultTimeoutInterval: 30000
    }

};
