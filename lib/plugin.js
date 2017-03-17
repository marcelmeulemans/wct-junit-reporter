var _ = require('lodash');
var xml = require('pixl-xml');
var fs = require("fs");
var he = require('he');
var path = require('path');

function JunitReporter(emitter, pluginOptions) {
    this.tests = [];
    this.options = pluginOptions;
    var appendMode = pluginOptions.appendMode;

    function getBrowserDescription(browser) {
        var result = browser.browserName;

        if (_.size(browser.version) > 0) {
            result = result.concat(' ', browser.version);
        }

        if (_.size(browser.platform) > 0) {
            result = result.concat(' on ', browser.platform);
        }

        return he.encode(result).replace('.', ',');
    }

    function collectTestResult(browser, test) {
        test.suite = he.encode(test.test[0] + ' (' + getBrowserDescription(browser) + ')');
        test.name = he.encode(_.slice(test.test, 1).join('; '));
        this.tests.push(test);
    }

    function writeTestReport() {
        var existingReports;
        var root = (pluginOptions.output && pluginOptions.output.path) ? pluginOptions.output.path : './';
        var filename = (pluginOptions.output && pluginOptions.output.name) ? pluginOptions.output.name : 'test-report.xml';
        var fullpath = root + filename;
        fs.mkdir(path.resolve(root), function (err, success) {
            if (err)
                return err;
        });

        if (appendMode) {
            try {
                existingReports = xml.parse(path.resolve(fullpath), {
                    preserveAttributes: true
                });
            } catch (e) {}
        }
        var results = {
            testsuites: {
                testsuite: _.map(_.sortBy(_.unique(_.pluck(this.tests, 'suite'))), function (suite) {
                    var tests = _.filter(this.tests, {
                        suite: suite
                    });
                    var testsuite = {
                        _Attribs: {
                            name: suite,
                            tests: tests.length,
                            errors: 0,
                            failures: _.size(_.filter(tests, {
                                state: 'failing'
                            })),
                            skipped: _.size(_.filter(tests, {
                                state: 'pending'
                            }))
                        },
                        testcase: _.map(tests, function (test) {
                            var testcase = {
                                _Attribs: {
                                    name: test.name,
                                    time: test.duration
                                }
                            };
                            if (test.state === 'failing') {
                                testcase.failure = {
                                    _Data: test.error.stack,
                                    _Attribs: {
                                        message: he.encode(test.error.message)
                                    }
                                };
                            }
                            if (test.state === 'error') {
                                testcase.error = {
                                    _Data: test.error.stack,
                                    _Attribs: {
                                        message: he.encode(test.error.message)
                                    }
                                };
                                testcase['system-out'] = he.encode(test.error.stack);
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
        if (existingReports) {
            results.testsuites.testsuite.push(existingReports.testsuite);
        }
        fs.writeFileSync(path.resolve(fullpath), xml.stringify(results).replace(/&amp;/g, '&'));
    }

    emitter.on('test-end', collectTestResult.bind(this));
    emitter.on('run-end', writeTestReport.bind(this));
};

module.exports = JunitReporter;
