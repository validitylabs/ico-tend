/**
 * Test for IcoCrowdsale
 *
 * yarn run dev
 * > test ./test/contracts/IcoCrowdsale.js
 */
import {waitNDays, getEvents, debug, BigNumber, cnf, increaseTimeTo, duration} from './helpers/tools'; // eslint-disable-line

const IcoCrowdsale  = artifacts.require('./IcoCrowdsale');
const IcoToken      = artifacts.require('./IcoToken');
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
    let icoTokenInstance;

    beforeEach(async () => {
        icoCrowdsaleInstance    = await IcoCrowdsale.deployed();
        const icoTokenAddress   = await icoCrowdsaleInstance.token();
        icoTokenInstance        = await IcoToken.at(icoTokenAddress);
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
        const _weiPerChf            = await icoCrowdsaleInstance.weiPerChf();
        const _wallet               = await icoCrowdsaleInstance.wallet();
        const _cap                  = await icoCrowdsaleInstance.cap();
        const _confirmationPeriod   = await icoCrowdsaleInstance.confirmationPeriod();
        const bigCap                = new BigNumber(cnf.cap);
        const confirmationPeriod    = new BigNumber(cnf.confirmationPeriod);

        _startTime.should.be.bignumber.equal(cnf.startTime);
        _endTime.should.be.bignumber.equal(cnf.endTime);
        _weiPerChf.should.be.bignumber.equal(cnf.rateWeiPerChf);
        _wallet.should.be.equal(wallet);
        _cap.should.be.bignumber.equal(bigCap.mul(10e18));
        _confirmationPeriod.div(60 * 60 * 24).should.be.bignumber.equal(confirmationPeriod);
    });

    it('should verify, the owner is added properly to manager accounts', async () => {
        const manager = await icoCrowdsaleInstance.isManager(owner);

        assert.isTrue(manager, 'Owner should be a manager too');
    });

    it('should set manager accounts', async () => {
        const tx1 = await icoCrowdsaleInstance.setManager(activeManager, true, {from: owner, gas: 1000000});
        const tx2 = await icoCrowdsaleInstance.setManager(inactiveManager, false, {from: owner, gas: 1000000});

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
        const tx1 = await icoCrowdsaleInstance.setManager(activeManager, false, {from: owner, gas: 1000000});
        const tx2 = await icoCrowdsaleInstance.setManager(inactiveManager, true, {from: owner, gas: 1000000});

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
        const tx3 = await icoCrowdsaleInstance.setManager(activeManager, true, {from: owner, gas: 1000000});
        const tx4 = await icoCrowdsaleInstance.setManager(inactiveManager, false, {from: owner, gas: 1000000});

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
            await icoCrowdsaleInstance.setManager(activeManager, false, {from: activeInvestor1, gas: 1000000});
            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should whitelist investor accounts', async () => {
        const tx1 = await icoCrowdsaleInstance.whiteListInvestor(activeInvestor1, {from: owner, gas: 1000000});
        const tx2 = await icoCrowdsaleInstance.whiteListInvestor(activeInvestor2, {from: activeManager, gas: 1000000});

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
        const tx            = await icoCrowdsaleInstance.unWhiteListInvestor(inactiveInvestor1, {from: owner, gas: 1000000});
        const whitelisted   = await icoCrowdsaleInstance.isWhitelisted(inactiveInvestor1);

        assert.isFalse(whitelisted, 'inactiveInvestor1 should be unwhitelisted');

        // Testing events
        const events = getEvents(tx, 'ChangedInvestorWhitelisting');

        assert.equal(events[0].investor, inactiveInvestor1, 'inactiveInvestor1 address doesn\'t match');
        assert.isFalse(events[0].whitelisted, 'inactiveInvestor1 should be unwhitelisted');
    });

    it('should fail, because we try to whitelist investor from unauthorized account', async () => {
        try {
            await icoCrowdsaleInstance.whiteListInvestor(inactiveInvestor1, {from: activeInvestor2, gas: 1000000});
            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should fail, because we try to unwhitelist investor from unauthorized account', async () => {
        try {
            await icoCrowdsaleInstance.whiteListInvestor(activeInvestor1, {from: activeInvestor2, gas: 1000000});
            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should whitelist 2 investors by batch function', async () => {
        await icoCrowdsaleInstance.unWhiteListInvestor(activeInvestor1, {from: owner, gas: 1000000});
        await icoCrowdsaleInstance.unWhiteListInvestor(activeInvestor2, {from: owner, gas: 1000000});

        const tx = await icoCrowdsaleInstance.batchWhiteListInvestors([activeInvestor1, activeInvestor2], {from: owner, gas: 1000000});

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
            await icoCrowdsaleInstance.mintTokenPreSale(activeInvestor1, 1, {from: activeManager, gas: 1000000});

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should fail, because we try to mint tokens more as cap limit allows', async () => {
        try {
            await icoCrowdsaleInstance.mintTokenPreSale(activeInvestor1, (cnf.cap + 1), {from: activeManager, gas: 1000000});

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should fail, because we try to trigger buyTokens in before contribution time is started', async () => {
        try {
            await icoCrowdsaleInstance.buyTokens(activeInvestor1, {from: activeInvestor2, gas: 1000000});

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should fail, because we try to trigger the fallback function before contribution time is started', async () => {
        try {
            await icoCrowdsaleInstance.sendTransaction({
                from:   owner,
                value:  web3.toWei(1, 'ether'),
                gas:    700000
            });

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should mint tokens for presale as owner', async () => {
        const activeInvestor1Balance1   = await icoTokenInstance.balanceOf(activeInvestor1);
        const activeInvestor2Balance1   = await icoTokenInstance.balanceOf(activeInvestor2);
        const zero                      = new BigNumber(0);
        const ten                       = new BigNumber(10);
        const five                      = new BigNumber(5);

        activeInvestor1Balance1.should.be.bignumber.equal(zero);
        activeInvestor2Balance1.should.be.bignumber.equal(zero);

        const tx1 = await icoCrowdsaleInstance.mintTokenPreSale(activeInvestor1, 10);
        const tx2 = await icoCrowdsaleInstance.mintTokenPreSale(activeInvestor2, 5);

        const activeInvestor1Balance2 = await icoTokenInstance.balanceOf(activeInvestor1);
        const activeInvestor2Balance2 = await icoTokenInstance.balanceOf(activeInvestor2);

        activeInvestor1Balance2.should.be.bignumber.equal(ten);
        activeInvestor2Balance2.should.be.bignumber.equal(five);

        // Testing events
        const events1 = getEvents(tx1, 'TokenPurchase');
        const events2 = getEvents(tx2, 'TokenPurchase');

        assert.equal(events1[0].purchaser, owner, '');
        assert.equal(events2[0].purchaser, owner, '');

        assert.equal(events1[0].beneficiary, activeInvestor1, '');
        assert.equal(events2[0].beneficiary, activeInvestor2, '');

        events1[0].value.should.be.bignumber.equal(zero);
        events1[0].amount.should.be.bignumber.equal(ten);

        events2[0].value.should.be.bignumber.equal(zero);
        events2[0].amount.should.be.bignumber.equal(five);
    });

    /**
     * [ Contribution period ]
     */
    it('should turn the time 35 days forward to contribution period', async () => {
        console.log('[ Contribution period ]'.yellow);
        await waitNDays(35);
    });

    it('should buyTokens properly', async () => {
        const zero  = new BigNumber(0);
        const tx    = await icoCrowdsaleInstance.buyTokens(
            activeInvestor1,
            {from: activeInvestor2, gas: 1000000, value: web3.toWei(2, 'ether')}
        );

        // Testing events
        const events = getEvents(tx, 'TokenPurchase');

        assert.equal(events[0].purchaser, activeInvestor2, 'activeInvestor2 does not match purchaser');
        assert.equal(events[0].beneficiary, activeInvestor1, 'activeInvestor1 does not match beneficiary');

        events[0].value.should.be.bignumber.equal(web3.toWei(2, 'ether'));
        events[0].amount.should.be.bignumber.equal(zero);
    });

    it('should fail, because we try to trigger buyTokens as unwhitelisted investor', async () => {
        try {
            await icoCrowdsaleInstance.buyTokens(activeInvestor1, {from: inactiveInvestor1, gas: 1000000, value: web3.toWei(2, 'ether')});

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    // @TODO: Check investments (via fallback call)
    it('should call the fallback function successfully', async () => {
        const zero  = new BigNumber(0);
        const tx1   = await icoCrowdsaleInstance.sendTransaction({
            from:   activeInvestor1,
            value:  web3.toWei(2, 'ether'),
            gas:    1000000
        });

        // Testing events
        const events1 = getEvents(tx1, 'TokenPurchase');

        assert.equal(events1[0].purchaser, activeInvestor1, 'activeInvestor1 does not match purchaser');
        assert.equal(events1[0].beneficiary, activeInvestor1, 'activeInvestor1 does not match beneficiary');

        events1[0].value.should.be.bignumber.equal(web3.toWei(2, 'ether'));
        events1[0].amount.should.be.bignumber.equal(zero);

        const tx2   = await icoCrowdsaleInstance.sendTransaction({
            from:   activeInvestor1,
            value:  web3.toWei(3, 'ether'),
            gas:    1000000
        });

        // Testing events
        const events2 = getEvents(tx2, 'TokenPurchase');

        assert.equal(events2[0].purchaser, activeInvestor1, 'activeInvestor1 does not match purchaser');
        assert.equal(events2[0].beneficiary, activeInvestor1, 'activeInvestor1 does not match beneficiary');

        events2[0].value.should.be.bignumber.equal(web3.toWei(3, 'ether'));
        events2[0].amount.should.be.bignumber.equal(zero);

        const tx3   = await icoCrowdsaleInstance.sendTransaction({
            from:   activeInvestor2,
            value:  web3.toWei(3, 'ether'),
            gas:    1000000
        });

        // Testing events
        const events3 = getEvents(tx3, 'TokenPurchase');

        assert.equal(events3[0].purchaser, activeInvestor2, 'activeInvestor2 does not match purchaser');
        assert.equal(events3[0].beneficiary, activeInvestor2, 'activeInvestor2 does not match beneficiary');

        events3[0].value.should.be.bignumber.equal(web3.toWei(3, 'ether'));
        events3[0].amount.should.be.bignumber.equal(zero);

        const tx4   = await icoCrowdsaleInstance.sendTransaction({
            from:   activeInvestor1,
            value:  web3.toWei(2, 'ether'),
            gas:    1000000
        });

        // Testing events
        const events4 = getEvents(tx4, 'TokenPurchase');

        assert.equal(events4[0].purchaser, activeInvestor1, 'activeInvestor1 does not match purchaser');
        assert.equal(events4[0].beneficiary, activeInvestor1, 'activeInvestor1 does not match beneficiary');

        events4[0].value.should.be.bignumber.equal(web3.toWei(2, 'ether'));
        events4[0].amount.should.be.bignumber.equal(zero);
    });

    it('should fail, because we try to trigger mintTokenPreSale in contribution period', async () => {
        try {
            await icoCrowdsaleInstance.mintTokenPreSale(activeInvestor1, 3, {from: activeInvestor2, gas: 1000000});

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should fail, because we try to trigger confirmPayment with non manager account', async () => {
        try {
            await icoCrowdsaleInstance.confirmPayment(0, {from: inactiveManager, gas: 1000000});

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should fail, because we try to trigger batchConfirmPayments with non manager account', async () => {
        try {
            await icoCrowdsaleInstance.batchConfirmPayments([0, 1], {from: inactiveManager, gas: 1000000});

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should fail, because we try to trigger unConfirmPayment with non manager account', async () => {
        try {
            await icoCrowdsaleInstance.unConfirmPayment(0, {from: inactiveManager, gas: 1000000});

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    /**
     * [ Confirmation period ]
     */
    it('should turn the time 10 days forward to Confirmation period', async () => {
        console.log('[ Confirmation period ]'.yellow);
        await waitNDays(10);
    });

    it('should fail, because we try to trigger mintTokenPreSale in Confirmation period', async () => {
        try {
            await icoCrowdsaleInstance.mintTokenPreSale(activeInvestor1, 3, {from: activeInvestor2, gas: 1000000});

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should trigger confirmPayment successfully', async () => {
        const tx        = await icoCrowdsaleInstance.confirmPayment(0, {from: activeManager, gas: 1000000});
        const events    = getEvents(tx, 'ChangedInvestmentConfirmation');

        assert.equal(events[0].investmentId, 0);
        assert.equal(events[0].investor, activeInvestor2); // @TODO: ok?
        assert.isTrue(events[0].confirmed);
    });

    it('should run batchConfirmPayments() successfully', async () => {
        const tx = await icoCrowdsaleInstance.batchConfirmPayments(
            [0, 1, 2, 3, 4],
            {from: activeManager, gas: 1000000}
        );

        const events = getEvents(tx, 'ChangedInvestmentConfirmation');

        assert.equal(events[0].investmentId, 0);
        assert.equal(events[0].investor, activeInvestor2);
        assert.isTrue(events[0].confirmed);

        assert.equal(events[1].investmentId, 1);
        assert.equal(events[1].investor, activeInvestor1);
        assert.isTrue(events[1].confirmed);

        assert.equal(events[2].investmentId, 2);
        assert.equal(events[2].investor, activeInvestor1);
        assert.isTrue(events[2].confirmed);

        assert.equal(events[3].investmentId, 3);
        assert.equal(events[3].investor, activeInvestor2);
        assert.isTrue(events[3].confirmed);

        assert.equal(events[4].investmentId, 4);
        assert.equal(events[4].investor, activeInvestor1);
        assert.isTrue(events[4].confirmed);

        // console.log(events);
        // @TODO: check correctness of investor addresses
        // activeInvestor2
        //     [ { investmentId: BigNumber { s: 1, e: 0, c: [Array] },
        //     investor: '0x0d1d4e623d10f9fba5db95830f7d3839406c6af2',
        //     confirmed: true },

        // activeInvestor1
        //   { investmentId: BigNumber { s: 1, e: 0, c: [Array] },
        //     investor: '0x821aea9a577a9b44299b9c15c88cf3087f3b5544',
        //     confirmed: true },

        // activeInvestor1
        //   { investmentId: BigNumber { s: 1, e: 0, c: [Array] },
        //     investor: '0x821aea9a577a9b44299b9c15c88cf3087f3b5544',
        //     confirmed: true },

        // activeInvestor2
        //   { investmentId: BigNumber { s: 1, e: 0, c: [Array] },
        //     investor: '0x0d1d4e623d10f9fba5db95830f7d3839406c6af2',
        //     confirmed: true },

        // activeInvestor1
        //   { investmentId: BigNumber { s: 1, e: 0, c: [Array] },
        //     investor: '0x821aea9a577a9b44299b9c15c88cf3087f3b5544',
        //     confirmed: true } ]
    });

    it('should run unConfirmPayment() successfully', async () => {
        const tx        = await icoCrowdsaleInstance.unConfirmPayment(2, {from: activeManager, gas: 1000000});
        const events    = getEvents(tx, 'ChangedInvestmentConfirmation');

        assert.equal(events[0].investmentId, 2);
        assert.equal(events[0].investor, activeInvestor1);
        assert.isFalse(events[0].confirmed);
    });

    it('should fail, because we try to trigger batchConfirmPayments with non manager account', async () => {
        try {
            await icoCrowdsaleInstance.batchConfirmPayments([0, 1], {from: inactiveManager, gas: 1000000});

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    /**
     * [ Confirmation period over ]
     */
    it('should turn the time 30 days forward, after the Confirmation period is over', async () => {
        console.log('[ Confirmation period over ]'.yellow);
        await waitNDays(30);
    });

    it('should fail, because we try to trigger confirmPayment after Confirmation period is over', async () => {
        try {
            await icoCrowdsaleInstance.confirmPayment(0, {from: activeManager, gas: 1000000});

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should fail, because we try to trigger batchConfirmPayments after Confirmation period is over', async () => {
        try {
            await icoCrowdsaleInstance.batchConfirmPayments([0, 1], {from: activeManager, gas: 1000000});

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should fail, because we try to trigger unConfirmPayment after Confirmation period is over', async () => {
        try {
            await icoCrowdsaleInstance.unConfirmPayment(0, {from: inactiveManager, gas: 1000000});

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    // @TODO: settleInvestment(uint256 investmentId) -> check investments from fallback test
    // @TODO: settleBatchInvestment(uint256 investmentId)
});
