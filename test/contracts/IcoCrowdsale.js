/**
 * Test for IcoCrowdsale
 *
 * yarn run dev
 * > test ./test/contracts/IcoCrowdsale.js
 */
const IcoCrowdsale = artifacts.require('./IcoCrowdsale');

import {startTime, endTime, rateEthPerToken} from '../../ico.cnf.json';
import {waitNDays, getEvents, debug, BigNumber, cnf, increaseTimeTo, duration} from './helpers/tools'; // eslint-disable-line

const moment        = require('moment'); // eslint-disable-line
const assertJump    = require('../../node_modules/zeppelin-solidity/test/helpers/assertJump');

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
    const activeInvestor1   = accounts[3];
    const activeInvestor2   = accounts[4];
    const inactiveInvestor1 = accounts[5];
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

        // Set DTS to 2017-12-24T00:00:00Z CET
        await increaseTimeTo(1514113200);

        const _startTime            = await icoCrowdsaleInstance.startTime();
        const _endTime              = await icoCrowdsaleInstance.endTime();
        const _rate                 = await icoCrowdsaleInstance.rate();
        const _wallet               = await icoCrowdsaleInstance.wallet();
        const _cap                  = await icoCrowdsaleInstance.cap();
        // const _confirmationPeriod   = await icoCrowdsaleInstance.confirmationPeriod();
        const bigCap                = new BigNumber(cnf.cap);

        _startTime.should.be.bignumber.equal(startTime);
        _endTime.should.be.bignumber.equal(endTime);
        _rate.should.be.bignumber.equal(rateEthPerToken);
        _wallet.should.be.equal(wallet);
        _cap.should.be.bignumber.equal(bigCap.mul(10e18));

        // @FIXME:
        // const confirmationPeriod = new BigNumber(cnf.confirmationPeriod);
        // console.log(confirmationPeriod, _confirmationPeriod);
        // _confirmationPeriod.should.be.bignumber.equal(confirmationPeriod);
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
            await icoCrowdsaleInstance.setManager(activeManager, false, {from: activeInvestor1});
            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should whitelist investor accounts', async () => {
        const tx1 = await icoCrowdsaleInstance.whiteListInvestor(activeInvestor1, {from: owner});
        const tx2 = await icoCrowdsaleInstance.whiteListInvestor(activeInvestor2, {from: activeManager});

        const whitelisted1 = await icoCrowdsaleInstance.isWhitelisted(activeInvestor1);
        const whitelisted2 = await icoCrowdsaleInstance.isWhitelisted(activeInvestor2);

        assert.isTrue(whitelisted1, 'Investor1 should be whitelisted');
        assert.isTrue(whitelisted2, 'Investor2 should be whitelisted');

        // Testing events
        const events1 = getEvents(tx1, 'ChangedInvestorWhitelisting');
        const events2 = getEvents(tx2, 'ChangedInvestorWhitelisting');

        assert.equal(events1[0].investor, activeInvestor1, 'Investor1 address doesn\'t match');
        assert.isTrue(events1[0].whitelisted, 'Investor1 should be whitelisted');

        assert.equal(events2[0].investor, activeInvestor2, 'Investor2 address doesn\'t match');
        assert.isTrue(events2[0].whitelisted, 'Investor2 should be whitelisted');
    });

    it('should unwhitelist investor account', async () => {
        const tx            = await icoCrowdsaleInstance.unWhiteListInvestor(inactiveInvestor1, {from: owner});
        const whitelisted   = await icoCrowdsaleInstance.isWhitelisted(inactiveInvestor1);

        assert.isFalse(whitelisted, 'inactiveInvestor1 should be unwhitelisted');

        // Testing events
        const events = getEvents(tx, 'ChangedInvestorWhitelisting');

        assert.equal(events[0].investor, inactiveInvestor1, 'inactiveInvestor1 address doesn\'t match');
        assert.isFalse(events[0].whitelisted, 'inactiveInvestor1 should be unwhitelisted');
    });

    it('should fail, because we try to whitelist investor from unauthorized account', async () => {
        try {
            await icoCrowdsaleInstance.whiteListInvestor(inactiveInvestor1, {from: activeInvestor2});
            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should fail, because we try to unwhitelist investor from unauthorized account', async () => {
        try {
            await icoCrowdsaleInstance.whiteListInvestor(activeInvestor1, {from: activeInvestor2});
            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should whitelist 2 investors by batch function', async () => {
        await icoCrowdsaleInstance.unWhiteListInvestor(activeInvestor1, {from: owner});
        await icoCrowdsaleInstance.unWhiteListInvestor(activeInvestor2, {from: owner});

        const tx = await icoCrowdsaleInstance.batchWhiteListInvestors([activeInvestor1, activeInvestor2], {from: owner});

        const whitelisted1  = await icoCrowdsaleInstance.isWhitelisted(activeInvestor1);
        const whitelisted2  = await icoCrowdsaleInstance.isWhitelisted(activeInvestor2);

        assert.isTrue(whitelisted1, 'activeInvestor1 should be whitelisted');
        assert.isTrue(whitelisted2, 'activeInvestor2 should be whitelisted');

        // Testing events
        const events = getEvents(tx, 'ChangedInvestorWhitelisting');

        assert.equal(events[0].investor, activeInvestor1, 'Investor1 address doesn\'t match');
        assert.isTrue(events[0].whitelisted, 'Investor1 should be whitelisted');

        assert.equal(events[1].investor, activeInvestor2, 'Investor2 address doesn\'t match');
        assert.isTrue(events[1].whitelisted, 'Investor2 should be whitelisted');
    });

    it('should verify the investor account states succesfully', async () => {
        const whitelisted1  = await icoCrowdsaleInstance.isWhitelisted(activeInvestor1);
        const whitelisted2  = await icoCrowdsaleInstance.isWhitelisted(activeInvestor2);
        const whitelisted3  = await icoCrowdsaleInstance.isWhitelisted(inactiveInvestor1);

        assert.isTrue(whitelisted1, 'activeInvestor1 should be whitelisted');
        assert.isTrue(whitelisted2, 'activeInvestor2 should be whitelisted');
        assert.isFalse(whitelisted3, 'inactiveInvestor1 should be unwhitelisted');
    });

    it('should fail, because we try to mint tokens for presale with a non owner account', async () => {
        try {
            await icoCrowdsaleInstance.mintTokenPreSale(activeInvestor1, 1, {from: activeManager});

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should fail, because we try to mint tokens more as cap limit allows', async () => {
        try {
            await icoCrowdsaleInstance.mintTokenPreSale(activeInvestor1, (cnf.cap + 1), {from: activeManager});

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    // @TODO: negativ test: buyTokens(investor1, {from: investor2}) // -> investor2 kauft für investor1 tokens
    // @TODO: negativ test: test fallback function

    // it('should mint tokens for presale as owner', async () => {
    //     const tx1 = await icoCrowdsaleInstance.mintTokenPreSale(activeInvestor1, 10, {from: owner});
    //     const tx2 = await icoCrowdsaleInstance.mintTokenPreSale(activeInvestor2, 5, {from: owner});

    //     // TokenPurchase(msg.sender, beneficiary, 0, tokens);
    //     // Testing events
    //     const events1 = getEvents(tx1, 'TokenPurchase');
    //     const events2 = getEvents(tx2, 'TokenPurchase');

    //     console.log(events1);
    // });

    /**
     * [ Contribution period ]
     */
    // it('should turn the time 30 days forward to reclaim period', async () => {
    //     console.log('[ Contribution period ]'.yellow);
    //     // await waitNDays(35);
    // });

    // @TODO: buyTokens(investor1, {from: investor2}) // -> investor2 kauft für investor1 tokens
    // @TODO: test fallback function
    // @TODO: failtest: await icoCrowdsaleInstance.mintTokenPreSale(activeInvestor1, 3, {from: activeManager});
    // @TODO: failtest: confirmPayment(uint256 investmentId)
    // @TODO: failtest: batchConfirmPayments(uint256[] investmentIds)
    // @TODO: failtest: unConfirmPayment(uint256 investmentId)
    // @TODO: whitelist / unwhitelist investor

    /**
     * [ Confirmation period ]
     */
    // it('should turn the time 30 days forward to reclaim period', async () => {
    //     console.log('[ Contribution period ]'.yellow);
    //     // await waitNDays(10);
    // });

    // @TODO: await icoCrowdsaleInstance.mintTokenPreSale(activeInvestor1, 3, {from: activeManager});
    // @TODO: confirmPayment(uint256 investmentId)
    // @TODO: batchConfirmPayments(uint256[] investmentIds)
    // @TODO: unConfirmPayment(uint256 investmentId)
    // @TODO: whitelist / unwhitelist investor

    // it('should do something', async () => {

    // });

    /**
     * [ Confirmation period over ]
     */
    // it('should turn the time 30 days forward to reclaim period', async () => {
    //     console.log('[ Contribution period ]'.yellow);
    //     // await waitNDays(30);
    // });
    // @TODO: failtest: confirmPayment(uint256 investmentId)
    // @TODO: failtest: batchConfirmPayments(uint256[] investmentIds)
    // @TODO: failtest: unConfirmPayment(uint256 investmentId)
});
