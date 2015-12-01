var _ = require('lodash');
var xml = require('pixl-xml');
var fs = require("fs");

function JunitReporter(emitter, pluginOptions) {
    this.tests = [];
    this.options = pluginOptions;

    function collectTestResult(browser, test) {
        if (test.test.length === 3) {
            test.suite = test.test[1] + ' on ' + browser.browserName + ' ' + browser.version + '';
            this.tests.push(test);
        }
    }

    function writeTestReport() {
        var results = {
            testsuites: {
                testsuite: _.map(_.sortBy(_.unique(_.pluck(this.tests, 'suite'))), function (suite) {
                    var tests = _.filter(this.tests, {suite: suite});
                    var testsuite = {
                        _Attribs: {name: suite, tests: tests.length, errors: 0, failures: _.size(_.filter(tests, {state: 'failing'})), skipped: _.size(_.filter(tests, {state: 'pending'}))},
                        testcase: _.map(tests, function (test) {
                            var testcase = {_Attribs: {name: test.test[2], time: test.duration}};
                            if (test.state === 'failing') {
                                testcase.failure = {_Attribs: {message: test.error.message}};
                            }

                            return testcase;
                        })
                    };

                    return testsuite;
                })
            }
        };

        fs.writeFileSync('test-report.xml', xml.stringify(results));
    }

    emitter.on('test-end', collectTestResult.bind(this));
    emitter.on('run-end', writeTestReport.bind(this));
};

module.exports = JunitReporter;
