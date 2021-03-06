'use strict';

const EXPECTEDVAL = 2112,
    SUITE = 'test1',
    DESCRIPT = 'demo test suite';

module.exports = {
    beforeTest: t => {
        return t.createContext(SUITE, DESCRIPT, EXPECTEDVAL + 1);
    },

    tests: {
        'should fail 1': context => {
            context.equal(context.userData, EXPECTEDVAL, "Darn, wish it passed!");
        },

        'throws an exception': () => {
            throw new Error('just failing a test');
        }
    }
};
