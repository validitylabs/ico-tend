/**
 * Test for IcoCrowdsale
 *
 * yarn run dev
 * > test ./test/contracts/IcoCrowdsale.js
 */

const IcoCrowdsale = artifacts.require('./IcoCrowdsale');

import {startTime, endTime, rateEthPerToken} from '../../ico.cnf.json';
import {waitNDays, getEvents, debug, BigNumber} from './helpers/tools'; // eslint-disable-line

const moment        = require('moment'); // eslint-disable-line
const assertJump    = require('./helpers/assertJump');

const should = require('chai') // eslint-disable-line
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

/**
 * IcoToken contract
 */
contract('IcoCrowdsale', (accounts) => {
    const owner             = accounts[0];
    const activeManager     = accounts[1];
    const inactiveManager   = accounts[2];
    const wallet            = accounts[6];

    // Provide icoTokenInstance for every test case
    let icoCrowdsaleInstance;
    beforeEach(async () => {
        icoCrowdsaleInstance = await IcoCrowdsale.deployed();
    });

    /**
     * [ Pre contribution period ]
     */

    it('should instantiate the ICO crowdsale correctly', async () => {
        console.log('[ Pre contribution period ]'.yellow);

        const _startTime = await icoCrowdsaleInstance.startTime();
        const _endTime   = await icoCrowdsaleInstance.endTime();
        const _rate      = await icoCrowdsaleInstance.rate();
        const _wallet    = await icoCrowdsaleInstance.wallet();

        _startTime.should.be.bignumber.equal(startTime);
        _endTime.should.be.bignumber.equal(endTime);
        _rate.should.be.bignumber.equal(rateEthPerToken);
        _wallet.should.be.equal(wallet);
    });

    it('should set manager / whitelister accounts', async () => {
        const tx1 = await icoCrowdsaleInstance.setManager(activeManager, true);
        const tx2 = await icoCrowdsaleInstance.setManager(inactiveManager, false);

        const manager1 = await icoCrowdsaleInstance.isManager(activeManager);
        const manager2 = await icoCrowdsaleInstance.isManager(inactiveManager);

        assert.isTrue(manager1, 'Treasurer 1 is active');
        assert.isFalse(manager2, 'Treasurer 2 is not active');

        // Testing events
        const events1 = getEvents(tx1, 'ChangedManager');
        const events2 = getEvents(tx2, 'ChangedManager');

        assert.equal(events1[0].manager, activeManager, 'activeManager address does not match');
        assert.isTrue(events1[0].active, 'activeManager expected to be active');

        assert.equal(events2[0].manager, inactiveManager, 'inactiveManager address does not match');
        assert.isFalse(events2[0].active, 'inactiveManager expected to be inactive');
    });

    /**
     * [ Contribution period ]
     */

    /**
     * [ Confirmation period ]
     */

    // it('should do something', async () => {

    // });
});
