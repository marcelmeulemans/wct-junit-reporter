var _ = require('lodash');
var xml = require('pixl-xml');
var fs = require("fs");
var he = require('he');

function JunitReporter(emitter, pluginOptions) {
    this.tests = [];
    this.options = pluginOptions;

    function encodeSuiteName(browser, test) {
        var name = [];

        name.push(test.test[1]);

        if (_.size(browser.platform) > 0) {
            name.push(browser.platform);
        }

        if (_.size(browser.version) > 0) {
            name.push(browser.browserName + ' ' + browser.version);
        } else {
            name.push(browser.browserName);
        }

        return _.map(name, function (x) { return he.encode(x).replace('.', '&#x2E;'); }).join('.');
    }

    function collectTestResult(browser, test) {
        if (_.size(test.test) === 3) {
            test.suite = encodeSuiteName(browser, test);
            test.name = he.encode(test.test[2]);
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
                            var testcase = {_Attribs: {name: test.name, time: test.duration}};
                            if (test.state === 'failing') {
                                testcase.failure = {_Attribs: {message: he.encode(test.error.message)}};
                            }
                            if (test.state === 'pending') {
                                testcase.skipped = {};
                            }

                            return testcase;
                        })
                    };

                    return testsuite;
                })
            }
        };

        fs.writeFileSync('test-report.xml', xml.stringify(results).replace(/&amp;/g, '&'));
    }

    emitter.on('test-end', collectTestResult.bind(this));
    emitter.on('run-end', writeTestReport.bind(this));
};

module.exports = JunitReporter;
