'use strict';

const proxyquire = require('proxyquire').noPreserveCache(),
    _ = require('lodash'),
    path = require('path'),
    constants = require('./constants'),
    degent = require('degent'),
    runner = require('./testFromModuleRunner'),
    loadModuleInfos = function (modules) {
        return _.map(modules, (m) => {
            const imports = proxyquire(m, {}),
                testCount = _.keys(imports.tests).length;

            return {module: m, testCount: testCount};
        });
    },
    runTests = function(module, testCount, eventEmitter) {
        eventEmitter.emit(constants.EVENTNAME, {
            notify:    'STARTMODULE',
            module:    module,
            dateTime:  new Date(),
            testCount: testCount
        });
        let passes = 0;
        return degent( function *() {
            for (let n = 0; n < testCount; n++) {
                let result = yield runner(module, n, eventEmitter);
                passes++;
            }

            eventEmitter.emit(constants.EVENTNAME, {
                notify:    'ENDMODULE',
                module:    module,
                dateTime:  new Date(),
                testCount: testCount,
                passes:    passes
            });
        });
    },
    runModules = function (moduleInfos, eventEmitter) {
        let done;
        const promise = new Promise(resolve => {
            done = resolve;
        });

        return degent( function *() {
            for(let n=0; n<moduleInfos.length; n++) {
                let mi = moduleInfos[n];
                yield runTests(mi.module, mi.testCount, eventEmitter);
            }

            done();
        });
        return promise;
    },
    appRoot = require('app-root-path'),
    requirify = function (moduleName) {
        return path.isAbsolute(moduleName) ? moduleName : `${appRoot}/${moduleName}`;
    };

module.exports = function (modules, eventEmitter) {
    const moduleInfos = loadModuleInfos(modules.map(requirify)),
        baseEvent = {
            notify:    'STARTMODULE',
            dateTime:  new Date(),
            testCount: _.sumBy(moduleInfos, m => m.testCount)
        };

    eventEmitter.emit(constants.EVENTNAME, _.merge({}, baseEvent, {
        notify: 'STARTSUITE'
    }));
    return runModules(moduleInfos, eventEmitter).then(() => {
        const d = new Date();

        eventEmitter.emit(constants.EVENTNAME, _.merge({}, baseEvent, {
            notify:   'ENDSUITE',
            dateTime: d,
            elapsed:  d.getTime() - baseEvent.dateTime.getTime()
        }));
    });
};
