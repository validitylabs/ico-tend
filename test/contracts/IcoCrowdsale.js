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
    const investor1         = accounts[3];
    const investor2         = accounts[4];
    const investor3         = accounts[5];
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

    it('should verify, the owner is added properly to manager accounts', async () => {
        const manager = await icoCrowdsaleInstance.isManager(owner);

        assert.isTrue(manager, 'Owner should be a manager too');
    });

    it('should set manager accounts', async () => {
        const tx1 = await icoCrowdsaleInstance.setManager(activeManager, true, {from: owner});
        const tx2 = await icoCrowdsaleInstance.setManager(inactiveManager, false, {from: owner});

        const manager1 = await icoCrowdsaleInstance.isManager(activeManager);
        const manager2 = await icoCrowdsaleInstance.isManager(inactiveManager);

        assert.isTrue(manager1, 'Manager 1 should be active');
        assert.isFalse(manager2, 'Manager 2 should be inactive');

        // Testing events
        const events1 = getEvents(tx1, 'ChangedManager');
        const events2 = getEvents(tx2, 'ChangedManager');

        assert.equal(events1[0].manager, activeManager, 'activeManager address does not match');
        assert.isTrue(events1[0].active, 'activeManager expected to be active');

        assert.equal(events2[0].manager, inactiveManager, 'inactiveManager address does not match');
        assert.isFalse(events2[0].active, 'inactiveManager expected to be inactive');
    });

    it('should alter manager accounts', async () => {
        const tx1 = await icoCrowdsaleInstance.setManager(activeManager, false, {from: owner});
        const tx2 = await icoCrowdsaleInstance.setManager(inactiveManager, true, {from: owner});

        const manager1 = await icoCrowdsaleInstance.isManager(activeManager);
        const manager2 = await icoCrowdsaleInstance.isManager(inactiveManager);

        assert.isFalse(manager1, 'Manager 1 should be inactive');
        assert.isTrue(manager2, 'Manager 2 should be active');

        // Testing events
        const events1 = getEvents(tx1, 'ChangedManager');
        const events2 = getEvents(tx2, 'ChangedManager');

        assert.isFalse(events1[0].active, 'activeManager expected to be inactive');
        assert.isTrue(events2[0].active, 'inactiveManager expected to be active');

        // Roll back to origin values
        const tx3 = await icoCrowdsaleInstance.setManager(activeManager, true, {from: owner});
        const tx4 = await icoCrowdsaleInstance.setManager(inactiveManager, false, {from: owner});

        const manager3 = await icoCrowdsaleInstance.isManager(activeManager);
        const manager4 = await icoCrowdsaleInstance.isManager(inactiveManager);

        assert.isTrue(manager3, 'Manager 1 should be active');
        assert.isFalse(manager4, 'Manager 2 should be inactive');

        const events3 = getEvents(tx3, 'ChangedManager');
        const events4 = getEvents(tx4, 'ChangedManager');

        assert.isTrue(events3[0].active, 'activeManager expected to be active');
        assert.isFalse(events4[0].active, 'inactiveManager expected to be inactive');
    });

    it('should fail, because we try to set manager from unauthorized account', async () => {
        try {
            await icoCrowdsaleInstance.setManager(activeManager, false, {from: investor1});
            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    // it('should whitelist investor accounts', async () => {

    // });

    /**
     * [ Contribution period ]
     */

    /**
     * [ Confirmation period ]
     */

    // it('should do something', async () => {

    // });
});
