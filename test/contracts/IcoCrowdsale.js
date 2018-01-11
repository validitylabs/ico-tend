/**
 * Test for IcoCrowdsale
 *
 * @author Validity Labs AG <info@validitylabs.org>
 */

// TODO: Update test cases for change requests

import {expectThrow, waitNDays, getEvents, BigNumber, cnf, increaseTimeTo} from './helpers/tools';

const IcoCrowdsale  = artifacts.require('./IcoCrowdsale');
const IcoToken      = artifacts.require('./IcoToken');

const should = require('chai') // eslint-disable-line
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

const zero      = new BigNumber(0);
const two       = new BigNumber(web3.toWei(2, 'ether'));

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

        await increaseTimeTo(cnf.startTimeTesting);

        const _startTime            = await icoCrowdsaleInstance.startTime();
        const _endTime              = await icoCrowdsaleInstance.endTime();
        const _weiPerChf            = await icoCrowdsaleInstance.weiPerChf();
        const _wallet               = await icoCrowdsaleInstance.wallet();
        const _confirmationPeriod   = await icoCrowdsaleInstance.confirmationPeriod();
        const confirmationPeriod    = new BigNumber(cnf.confirmationPeriod);

        _startTime.should.be.bignumber.equal(cnf.startTime);
        _endTime.should.be.bignumber.equal(cnf.endTime);
        _weiPerChf.should.be.bignumber.equal(cnf.rateWeiPerChf);
        _wallet.should.be.equal(wallet);
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
        await expectThrow(icoCrowdsaleInstance.setManager(activeManager, false, {from: activeInvestor1, gas: 1000000}));
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
        await expectThrow(icoCrowdsaleInstance.whiteListInvestor(inactiveInvestor1, {from: activeInvestor2, gas: 1000000}));
    });

    it('should fail, because we try to unwhitelist investor from unauthorized account', async () => {
        await expectThrow(icoCrowdsaleInstance.whiteListInvestor(activeInvestor1, {from: activeInvestor2, gas: 1000000}));
    });

    it('should fail, because we try to run batchWhiteListInvestors with a non manager account', async () => {
        await expectThrow(icoCrowdsaleInstance.batchWhiteListInvestors([activeInvestor1, activeInvestor2], {from: activeInvestor2, gas: 1000000}));
    });

    it('should fail, because we try to run unWhiteListInvestor with a non manager account', async () => {
        await expectThrow(icoCrowdsaleInstance.unWhiteListInvestor(activeInvestor1, {from: activeInvestor2, gas: 1000000}));
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
        await expectThrow(icoCrowdsaleInstance.mintTokenPreSale(activeInvestor1, 1, {from: activeManager, gas: 1000000}));
    });

    it('should fail, because we try to mint tokens more as cap limit allows', async () => {
        const big = new BigNumber(95000000 * 1e18);
        await expectThrow(icoCrowdsaleInstance.mintTokenPreSale(activeInvestor1, (cnf.cap + big.add(1))));
    });

    it('should fail, because we try to trigger buyTokens in before contribution time is started', async () => {
        await expectThrow(icoCrowdsaleInstance.buyTokens(activeInvestor1, {from: activeInvestor2, gas: 1000000}));
    });

    it('should fail, because we try to trigger the fallback function before contribution time is started', async () => {
        await expectThrow(icoCrowdsaleInstance.sendTransaction({
            from:   owner,
            value:  web3.toWei(1, 'ether'),
            gas:    700000
        }));
    });

    it('should mint tokens for presale', async () => {
        const activeInvestor1Balance1   = await icoTokenInstance.balanceOf(activeInvestor1);
        const activeInvestor2Balance1   = await icoTokenInstance.balanceOf(activeInvestor2);
        const tenB                       = new BigNumber(10);
        const fiveB                      = new BigNumber(5);

        activeInvestor1Balance1.should.be.bignumber.equal(zero);
        activeInvestor2Balance1.should.be.bignumber.equal(zero);

        const tx1 = await icoCrowdsaleInstance.mintTokenPreSale(activeInvestor1, 10);
        const tx2 = await icoCrowdsaleInstance.mintTokenPreSale(activeInvestor2, 5);

        const activeInvestor1Balance2 = await icoTokenInstance.balanceOf(activeInvestor1);
        const activeInvestor2Balance2 = await icoTokenInstance.balanceOf(activeInvestor2);

        activeInvestor1Balance2.should.be.bignumber.equal(zero);
        activeInvestor2Balance2.should.be.bignumber.equal(zero);

        // Testing events
        const events1 = getEvents(tx1, 'TokenPurchase');
        const events2 = getEvents(tx2, 'TokenPurchase');

        assert.equal(events1[0].purchaser, owner, '');
        assert.equal(events2[0].purchaser, owner, '');

        assert.equal(events1[0].beneficiary, activeInvestor1, '');
        assert.equal(events2[0].beneficiary, activeInvestor2, '');

        events1[0].value.should.be.bignumber.equal(zero);
        assert.equal(events1[0].amount.toNumber(), web3.toWei(tenB, 'ether').toNumber());

        events2[0].value.should.be.bignumber.equal(zero);
        assert.equal(events2[0].amount.toNumber(), web3.toWei(fiveB, 'ether').toNumber());
    });

    /**
     * [ Contribution period ]
     */
    it('should turn the time 35 days forward to contribution period', async () => {
        console.log('[ Contribution period ]'.yellow);
        await waitNDays(35);
    });

    it('should fail, because we try to trigger buyTokens as unwhitelisted investor', async () => {
        await expectThrow(icoCrowdsaleInstance.buyTokens(activeInvestor1, {
            from: inactiveInvestor1,
            gas: 1000000,
            value: web3.toWei(2, 'ether')
        }));
    });

    it('should fail, because we try to trigger buyTokens with a too low investment', async () => {
        await expectThrow(icoCrowdsaleInstance.buyTokens(
            activeInvestor1,
            {from: activeInvestor1, gas: 1000000, value: web3.toWei(1, 'ether')}
        ));
    });

    it('should fail, because we try to trigger buyTokens for beneficiary 0x0', async () => {
        await expectThrow(icoCrowdsaleInstance.buyTokens(
            '0x0',
            {from: activeInvestor1, gas: 1000000, value: web3.toWei(1, 'ether')}
        ));
    });

    it('should buyTokens properly', async () => {
        const tx    = await icoCrowdsaleInstance.buyTokens(
            activeInvestor1,
            {from: activeInvestor2, gas: 1000000, value: web3.toWei(2, 'ether')}
        );

        const investment2    = await icoCrowdsaleInstance.investments(2);

        assert.equal(investment2[0], activeInvestor2);  // Investor
        assert.equal(investment2[1], activeInvestor1);  // Beneficiary
        investment2[2].should.be.bignumber.equal(web3.toWei(2, 'ether'));   // Amount
        //investment2[3].should.be.bignumber.equal(0);    // Token Amount TODO: Calc actual token amount and replace w/ zero
        assert.isFalse(investment2[4]);                 // Confirmed
        assert.isFalse(investment2[5]);                 // AttemptedSettlement
        assert.isFalse(investment2[6]);                 // CompletedSettlement

        // Testing events
        const events = getEvents(tx, 'TokenPurchase');

        assert.equal(events[0].purchaser, activeInvestor2, 'activeInvestor2 does not match purchaser');
        assert.equal(events[0].beneficiary, activeInvestor1, 'activeInvestor1 does not match beneficiary');

        events[0].value.should.be.bignumber.equal(web3.toWei(2, 'ether'));
        //events[0].amount.should.be.bignumber.equal(799200000000000000000); TODO: Calc actual token amount and replace w/ zero
    });

    it('should call the fallback function successfully', async () => {
        const tx1   = await icoCrowdsaleInstance.sendTransaction({
            from:   activeInvestor1,
            value:  web3.toWei(3, 'ether'),
            gas:    1000000
        });

        const investment3 = await icoCrowdsaleInstance.investments(3);

        assert.equal(investment3[0], activeInvestor1);   // Investor
        assert.equal(investment3[1], activeInvestor1);   // Beneficiary
        investment3[2].should.be.bignumber.equal(web3.toWei(3, 'ether'));  // Amount
        //investment3[3].should.be.bignumber.equal(0);   // Token Amount TODO: Calc actual token amount and replace w/ zero
        assert.isFalse(investment3[4]);                  // Confirmed
        assert.isFalse(investment3[5]);                  // AttemptedSettlement
        assert.isFalse(investment3[6]);                  // CompletedSettlement

        // Testing events
        const events1 = getEvents(tx1, 'TokenPurchase');

        assert.equal(events1[0].purchaser, activeInvestor1, 'activeInvestor1 does not match purchaser');
        assert.equal(events1[0].beneficiary, activeInvestor1, 'activeInvestor1 does not match beneficiary');

        events1[0].value.should.be.bignumber.equal(web3.toWei(3, 'ether'));
        //events1[0].amount.should.be.bignumber.equal(zero); TODO: Calc actual token amount and replace w/ zero

        const tx2   = await icoCrowdsaleInstance.sendTransaction({
            from:   activeInvestor1,
            value:  web3.toWei(4, 'ether'),
            gas:    1000000
        });

        const investment4 = await icoCrowdsaleInstance.investments(4);

        assert.equal(investment4[0], activeInvestor1);   // Investor
        assert.equal(investment4[1], activeInvestor1);   // Beneficiary
        investment4[2].should.be.bignumber.equal(web3.toWei(4, 'ether'));  // Amount
        //investment4[3].should.be.bignumber.equal(0);   // Token Amount TODO: Calc actual token amount and replace w/ zero
        assert.isFalse(investment4[4]);                  // Confirmed
        assert.isFalse(investment4[5]);                  // AttemptedSettlement
        assert.isFalse(investment4[6]);                  // CompletedSettlement

        // Testing events
        const events2 = getEvents(tx2, 'TokenPurchase');

        assert.equal(events2[0].purchaser, activeInvestor1, 'activeInvestor1 does not match purchaser');
        assert.equal(events2[0].beneficiary, activeInvestor1, 'activeInvestor1 does not match beneficiary');

        events2[0].value.should.be.bignumber.equal(web3.toWei(4, 'ether'));
        //events2[0].amount.should.be.bignumber.equal(zero); TODO: Calc actual token amount and replace w/ zero

        const tx3   = await icoCrowdsaleInstance.sendTransaction({
            from:   activeInvestor2,
            value:  web3.toWei(5, 'ether'),
            gas:    1000000
        });

        const investment5 = await icoCrowdsaleInstance.investments(5);

        assert.equal(investment5[0], activeInvestor2);      // Investor
        assert.equal(investment5[1], activeInvestor2);      // Beneficiary
        investment5[2].should.be.bignumber.equal(web3.toWei(5, 'ether')); // Amount
        //investment5[3].should.be.bignumber.equal(0);   // Token Amount TODO: Calc actual token amount and replace w/ zero
        assert.isFalse(investment5[4]);                  // Confirmed
        assert.isFalse(investment5[5]);                  // AttemptedSettlement
        assert.isFalse(investment5[6]);                  // CompletedSettlement

        // Testing events
        const events3 = getEvents(tx3, 'TokenPurchase');

        assert.equal(events3[0].purchaser, activeInvestor2, 'activeInvestor2 does not match purchaser');
        assert.equal(events3[0].beneficiary, activeInvestor2, 'activeInvestor2 does not match beneficiary');

        events3[0].value.should.be.bignumber.equal(web3.toWei(5, 'ether'));
        //events3[0].amount.should.be.bignumber.equal(zero); TODO: Calc actual token amount and replace w/ zero

        const tx4   = await icoCrowdsaleInstance.sendTransaction({
            from:   activeInvestor1,
            value:  web3.toWei(6, 'ether'),
            gas:    1000000
        });

        const investment6 = await icoCrowdsaleInstance.investments(6);

        assert.equal(investment6[0], activeInvestor1);  // Investor
        assert.equal(investment6[1], activeInvestor1);  // Beneficiary
        investment6[2].should.be.bignumber.equal(web3.toWei(6, 'ether'));   // Amount
        //investment6[3].should.be.bignumber.equal(0);    // Token Amount TODO: Calc actual token amount and replace w/ zero
        assert.isFalse(investment6[4]);                 // Confirmed
        assert.isFalse(investment6[5]);                 // AttemptedSettlement
        assert.isFalse(investment6[6]);                 // CompletedSettlement

        // Testing events
        const events4 = getEvents(tx4, 'TokenPurchase');

        assert.equal(events4[0].purchaser, activeInvestor1, 'activeInvestor1 does not match purchaser');
        assert.equal(events4[0].beneficiary, activeInvestor1, 'activeInvestor1 does not match beneficiary');

        events4[0].value.should.be.bignumber.equal(web3.toWei(6, 'ether'));
        //events4[0].amount.should.be.bignumber.equal(zero); TODO: Calc actual token amount and replace w/ zero
    });

    it('should buyTokens (for token contract) properly', async () => {
        const tokenAddress = await icoCrowdsaleInstance.token();

        await icoCrowdsaleInstance.buyTokens(
            tokenAddress,
            {from: activeInvestor2, gas: 1000000, value: web3.toWei(7, 'ether')}
        );

        const investment7    = await icoCrowdsaleInstance.investments(7);

        assert.equal(investment7[0], activeInvestor2);   // Investor
        assert.equal(investment7[1], tokenAddress);      // Beneficiary
        investment7[2].should.be.bignumber.equal(web3.toWei(7, 'ether'));   // Amount
        //investment7[3].should.be.bignumber.equal(0);   // Token Amount TODO: Calc actual token amount and replace w/ zero
        assert.isFalse(investment7[4]);                  // Confirmed
        assert.isFalse(investment7[5]);                  // AttemptedSettlement
        assert.isFalse(investment7[6]);                  // CompletedSettlement
    });

    it('should fail, because we try to trigger mintTokenPreSale in contribution period', async () => {
        await expectThrow(icoCrowdsaleInstance.mintTokenPreSale(activeInvestor1, 3));
    });

    it('should fail, because we try to trigger confirmPayment with non manager account', async () => {
        await expectThrow(icoCrowdsaleInstance.confirmPayment(0, {from: inactiveManager, gas: 1000000}));
    });

    it('should fail, because we try to trigger batchConfirmPayments with non manager account', async () => {
        await expectThrow(icoCrowdsaleInstance.batchConfirmPayments([0, 1], {from: inactiveManager, gas: 1000000}));
    });

    it('should fail, because we try to trigger unConfirmPayment with non manager account', async () => {
        await expectThrow(icoCrowdsaleInstance.unConfirmPayment(0, {from: inactiveManager, gas: 1000000}));
    });

    it('should fail, because we try to run finalizeConfirmationPeriod with a non manager account', async () => {
        await expectThrow(icoCrowdsaleInstance.finalizeConfirmationPeriod({from: activeInvestor1, gas: 1000000}));
    });

    it('should fail, because we try to trigger unConfirmPayment before Confirmation period', async () => {
        await expectThrow(icoCrowdsaleInstance.unConfirmPayment(0, {from: activeManager, gas: 1000000}));
    });

    it('should fail, because we try to trigger batchConfirmPayments before Confirmation period', async () => {
        await expectThrow(icoCrowdsaleInstance.batchConfirmPayments([0, 1], {from: activeManager, gas: 1000000}));
    });

    it('should fail, because we try to trigger confirmPayment before Confirmation period', async () => {
        await expectThrow(icoCrowdsaleInstance.confirmPayment(0, {from: activeManager, gas: 1000000}));
    });

    /**
     * [ Confirmation period ]
     */
    it('should turn the time 10 days forward to Confirmation period', async () => {
        console.log('[ Confirmation period ]'.yellow);
        await waitNDays(10);
    });

    it('should fail, because we try to trigger mintTokenPreSale in Confirmation period', async () => {
        await expectThrow(icoCrowdsaleInstance.mintTokenPreSale(activeInvestor1, 3));
    });

    it('should trigger confirmPayment successfully', async () => {
        const tx            = await icoCrowdsaleInstance.confirmPayment(2, {from: activeManager, gas: 1000000});
        const events        = getEvents(tx, 'ChangedInvestmentConfirmation');
        const investment2    = await icoCrowdsaleInstance.investments(2);
        const investment3   = await icoCrowdsaleInstance.investments(3);
        const investment4   = await icoCrowdsaleInstance.investments(4);
        const investment5   = await icoCrowdsaleInstance.investments(5);
        const investment6   = await icoCrowdsaleInstance.investments(6);

        assert.equal(investment2[0], activeInvestor2);   // Investor
        assert.equal(investment2[1], activeInvestor1);   // Beneficiary
        investment2[2].should.be.bignumber.equal(web3.toWei(2, 'ether'));   // Amount
        assert.isTrue(investment2[4]);                   // Confirmed
        assert.isFalse(investment2[5]);                  // AttemptedSettlement
        assert.isFalse(investment2[6]);                  // CompletedSettlement

        assert.equal(investment3[0], activeInvestor1);   // Investor
        assert.equal(investment3[1], activeInvestor1);   // Beneficiary
        investment3[2].should.be.bignumber.equal(web3.toWei(3, 'ether'));  // Amount
        assert.isFalse(investment3[4]);                  // Confirmed
        assert.isFalse(investment3[5]);                  // AttemptedSettlement
        assert.isFalse(investment3[6]);                  // CompletedSettlement

        assert.equal(investment4[0], activeInvestor1);   // Investor
        assert.equal(investment4[1], activeInvestor1);   // Beneficiary
        investment4[2].should.be.bignumber.equal(web3.toWei(4, 'ether'));  // Amount
        assert.isFalse(investment4[4]);                  // Confirmed
        assert.isFalse(investment4[5]);                  // AttemptedSettlement
        assert.isFalse(investment4[6]);                  // CompletedSettlement

        assert.equal(investment5[0], activeInvestor2);      // Investor
        assert.equal(investment5[1], activeInvestor2);      // Beneficiary
        investment5[2].should.be.bignumber.equal(web3.toWei(5, 'ether')); // Amount
        assert.isFalse(investment5[4]);                     // Confirmed
        assert.isFalse(investment5[5]);                     // AttemptedSettlement
        assert.isFalse(investment5[6]);                     // CompletedSettlement

        assert.equal(investment6[0], activeInvestor1);      // Investor
        assert.equal(investment6[1], activeInvestor1);      // Beneficiary
        investment6[2].should.be.bignumber.equal(web3.toWei(6, 'ether'));   // Amount
        assert.isFalse(investment6[4]);                     // Confirmed
        assert.isFalse(investment6[5]);                     // AttemptedSettlement
        assert.isFalse(investment6[6]);                     // CompletedSettlement

        assert.equal(events[0].investmentId.toNumber(), 2);
        assert.equal(events[0].investor, activeInvestor2);
        assert.isTrue(events[0].confirmed);
    });

    it('should run batchConfirmPayments() successfully', async () => {
        const tx = await icoCrowdsaleInstance.batchConfirmPayments(
            [2, 3, 4, 5],
            {from: activeManager, gas: 1000000}
        );

        const investment6   = await icoCrowdsaleInstance.investments(6);
        const events        = getEvents(tx, 'ChangedInvestmentConfirmation');

        assert.equal(investment6[0], activeInvestor1);      // Investor
        assert.equal(investment6[1], activeInvestor1);      // Beneficiary
        investment6[2].should.be.bignumber.equal(web3.toWei(6, 'ether'));   // Amount
        assert.isFalse(investment6[4]);                     // Confirmed
        assert.isFalse(investment6[5]);                     // AttemptedSettlement
        assert.isFalse(investment6[6]);                     // CompletedSettlement

        assert.equal(events[0].investmentId.toNumber(), 2);
        assert.equal(events[0].investor, activeInvestor2);
        assert.isTrue(events[0].confirmed);

        assert.equal(events[1].investmentId.toNumber(), 3);
        assert.equal(events[1].investor, activeInvestor1);
        assert.isTrue(events[1].confirmed);

        assert.equal(events[2].investmentId.toNumber(), 4);
        assert.equal(events[2].investor, activeInvestor1);
        assert.isTrue(events[2].confirmed);

        assert.equal(events[3].investmentId.toNumber(), 5);
        assert.equal(events[3].investor, activeInvestor2);
        assert.isTrue(events[3].confirmed);
    });

    it('should run unConfirmPayment() successfully', async () => {
        const tx            = await icoCrowdsaleInstance.unConfirmPayment(5, {from: activeManager, gas: 1000000});
        const events        = getEvents(tx, 'ChangedInvestmentConfirmation');
        const investment2   = await icoCrowdsaleInstance.investments(2);
        const investment3   = await icoCrowdsaleInstance.investments(3);
        const investment4   = await icoCrowdsaleInstance.investments(4);
        const investment5   = await icoCrowdsaleInstance.investments(5);
        const investment6   = await icoCrowdsaleInstance.investments(6);

        assert.equal(investment2[0], activeInvestor2);   // Investor
        assert.equal(investment2[1], activeInvestor1);   // Beneficiary
        investment2[2].should.be.bignumber.equal(web3.toWei(2, 'ether'));   // Amount
        assert.isTrue(investment2[4]);                   // Confirmed
        assert.isFalse(investment2[5]);                  // AttemptedSettlement
        assert.isFalse(investment2[6]);                  // CompletedSettlement

        assert.equal(investment3[0], activeInvestor1);   // Investor
        assert.equal(investment3[1], activeInvestor1);   // Beneficiary
        investment3[2].should.be.bignumber.equal(web3.toWei(3, 'ether'));  // Amount
        assert.isTrue(investment3[4]);                  // Confirmed
        assert.isFalse(investment3[5]);                  // AttemptedSettlement
        assert.isFalse(investment3[6]);                  // CompletedSettlement

        assert.equal(investment4[0], activeInvestor1);   // Investor
        assert.equal(investment4[1], activeInvestor1);   // Beneficiary
        investment4[2].should.be.bignumber.equal(web3.toWei(4, 'ether'));  // Amount
        assert.isTrue(investment4[4]);                  // Confirmed
        assert.isFalse(investment4[5]);                  // AttemptedSettlement
        assert.isFalse(investment4[6]);                  // CompletedSettlement

        assert.equal(investment5[0], activeInvestor2);      // Investor
        assert.equal(investment5[1], activeInvestor2);      // Beneficiary
        investment5[2].should.be.bignumber.equal(web3.toWei(5, 'ether')); // Amount
        assert.isFalse(investment5[4]);                     // Confirmed
        assert.isFalse(investment5[5]);                     // AttemptedSettlement
        assert.isFalse(investment5[6]);                     // CompletedSettlement

        assert.equal(investment6[0], activeInvestor1);      // Investor
        assert.equal(investment6[1], activeInvestor1);      // Beneficiary
        investment6[2].should.be.bignumber.equal(web3.toWei(6, 'ether'));   // Amount
        assert.isFalse(investment6[4]);                     // Confirmed
        assert.isFalse(investment6[5]);                     // AttemptedSettlement
        assert.isFalse(investment6[6]);                     // CompletedSettlement

        assert.equal(events[0].investmentId.toNumber(), 5);
        assert.equal(events[0].investor, activeInvestor2);
        assert.isFalse(events[0].confirmed);
    });

    it('should fail, because we try to trigger batchConfirmPayments with non manager account', async () => {
        await expectThrow(icoCrowdsaleInstance.batchConfirmPayments([3, 4], {from: inactiveManager, gas: 1000000}));
    });

    it('should fail, because we try to trigger settleInvestment before confirmation period is over', async () => {
        await expectThrow(icoCrowdsaleInstance.settleInvestment(0, {from: activeManager, gas: 1000000}));
    });

    it('should fail, because we try to trigger batchSettleInvestments before confirmation period is over', async () => {
        await expectThrow(icoCrowdsaleInstance.batchSettleInvestments([0, 1, 2], {from: activeManager, gas: 1000000}));
    });

    it('should fail, because we try to trigger finalize before confirmation period is over', async () => {
        await expectThrow(icoCrowdsaleInstance.finalize());
    });

    /**
     * [ Confirmation period over ]
     */
    it('should run finalizeConfirmationPeriod successfully before confirmation period is over', async () => {
        console.log('[ Confirmation period over ]'.yellow);

        const confirmationPeriodOverBefore  = await icoCrowdsaleInstance.confirmationPeriodOver();
        await icoCrowdsaleInstance.finalizeConfirmationPeriod({from: owner, gas: 1000000});
        const confirmationPeriodOverAfter   = await icoCrowdsaleInstance.confirmationPeriodOver();

        assert.isFalse(confirmationPeriodOverBefore);
        assert.isTrue(confirmationPeriodOverAfter);
    });

    it('should fail, because we try to mint tokens for presale after Confirmation period is over', async () => {
        await expectThrow(icoCrowdsaleInstance.mintTokenPreSale(activeInvestor1, 1));
    });

    it('should fail, because we try to trigger confirmPayment after Confirmation period is over', async () => {
        await expectThrow(icoCrowdsaleInstance.confirmPayment(0, {from: activeManager, gas: 1000000}));
    });

    it('should fail, because we try to trigger batchConfirmPayments after Confirmation period is over', async () => {
        await expectThrow(icoCrowdsaleInstance.batchConfirmPayments([3, 4], {from: activeManager, gas: 1000000}));
    });

    it('should fail, because we try to trigger unConfirmPayment after Confirmation period is over', async () => {
        await expectThrow(icoCrowdsaleInstance.unConfirmPayment(0, {from: activeManager, gas: 1000000}));
    });

    it('should fail, because we try to trigger first settleInvestments with investmentId > 0', async () => {
        await expectThrow(icoCrowdsaleInstance.settleInvestment(1, {from: activeInvestor1, gas: 1000000}));
    });

    it('should fail, because we try to trigger first batchSettleInvestments with wrong investmentId order', async () => {
        await expectThrow(icoCrowdsaleInstance.batchSettleInvestments([2, 1, 0], {from: activeInvestor2, gas: 1000000}));
    });

    it('should run settleInvestment for first investment successfully', async () => {
        const investment2   = await icoCrowdsaleInstance.investments(2);
        const investment3   = await icoCrowdsaleInstance.investments(3);
        const investment4   = await icoCrowdsaleInstance.investments(4);
        const investment5   = await icoCrowdsaleInstance.investments(5);
        const investment6   = await icoCrowdsaleInstance.investments(6);

        investment2[2].should.be.bignumber.equal(web3.toWei(2, 'ether'));   // Amount
        assert.isTrue(investment2[4]);                   // Confirmed
        assert.isFalse(investment2[5]);                  // AttemptedSettlement
        assert.isFalse(investment2[6]);                  // CompletedSettlement

        investment3[2].should.be.bignumber.equal(web3.toWei(3, 'ether')); // Amount
        assert.isTrue(investment3[4]);                  // Confirmed
        assert.isFalse(investment3[5]);                 // AttemptedSettlement
        assert.isFalse(investment3[6]);                 // CompletedSettlement

        investment4[2].should.be.bignumber.equal(web3.toWei(4, 'ether')); // Amount
        assert.isTrue(investment4[4]);                  // Confirmed
        assert.isFalse(investment4[5]);                 // AttemptedSettlement
        assert.isFalse(investment4[6]);                 // CompletedSettlement

        investment5[2].should.be.bignumber.equal(web3.toWei(5, 'ether')); // Amount
        assert.isFalse(investment5[4]);                     // Confirmed
        assert.isFalse(investment5[5]);                     // AttemptedSettlement
        assert.isFalse(investment5[6]);                     // CompletedSettlement

        investment6[2].should.be.bignumber.equal(web3.toWei(6, 'ether'));   // Amount
        assert.isFalse(investment6[4]);                     // Confirmed
        assert.isFalse(investment6[5]);                     // AttemptedSettlement
        assert.isFalse(investment6[6]);                     // CompletedSettlement

        const balanceContractBefore     = await web3.eth.getBalance(icoCrowdsaleInstance.address);
        const balanceWalletBefore       = await web3.eth.getBalance(wallet);
        const balanceInvestor1Before    = await icoTokenInstance.balanceOf(activeInvestor1);
        const balanceInvestor2Before    = await icoTokenInstance.balanceOf(activeInvestor2);

        await icoCrowdsaleInstance.settleInvestment(2, {from: inactiveInvestor1, gas: 1000000});

        const balanceContractAfter     = await web3.eth.getBalance(icoCrowdsaleInstance.address);
        const balanceInvestor1After    = await icoTokenInstance.balanceOf(activeInvestor1);
        const balanceInvestor2After    = await icoTokenInstance.balanceOf(activeInvestor2);

        balanceContractBefore.sub(balanceContractAfter).should.be.bignumber.equal(two);
        balanceInvestor2Before.should.be.bignumber.equal(balanceInvestor2After);

        const sixsixsix = new BigNumber(666);

        balanceContractAfter.add(web3.toWei(102, 'ether')).should.be.bignumber.equal(balanceContractBefore.add(balanceWalletBefore));

        balanceInvestor1Before.should.be.bignumber.equal(10);
        balanceInvestor1After.should.be.bignumber.equal(web3.toWei(sixsixsix, 'ether').add(10));

        const investmentAfter2   = await icoCrowdsaleInstance.investments(2);
        const investmentAfter3   = await icoCrowdsaleInstance.investments(3);
        const investmentAfter4   = await icoCrowdsaleInstance.investments(4);
        const investmentAfter5   = await icoCrowdsaleInstance.investments(5);
        const investmentAfter6   = await icoCrowdsaleInstance.investments(6);

        investmentAfter2[2].should.be.bignumber.equal(web3.toWei(2, 'ether'));  // Amount
        assert.isTrue(investmentAfter2[4]);                  // Confirmed
        assert.isTrue(investmentAfter2[5]);                  // AttemptedSettlement
        assert.isTrue(investmentAfter2[6]);                  // CompletedSettlement

        investmentAfter3[2].should.be.bignumber.equal(web3.toWei(3, 'ether'));    // Amount
        assert.isTrue(investmentAfter3[4]);                     // Confirmed
        assert.isFalse(investmentAfter3[5]);                    // AttemptedSettlement
        assert.isFalse(investmentAfter3[6]);                    // CompletedSettlement

        investmentAfter4[2].should.be.bignumber.equal(web3.toWei(4, 'ether'));    // Amount
        assert.isTrue(investmentAfter4[4]);                     // Confirmed
        assert.isFalse(investmentAfter4[5]);                    // AttemptedSettlement
        assert.isFalse(investmentAfter4[6]);                    // CompletedSettlement

        investmentAfter5[2].should.be.bignumber.equal(web3.toWei(5, 'ether'));    // Amount
        assert.isFalse(investmentAfter5[4]);                        // Confirmed
        assert.isFalse(investmentAfter5[5]);                        // AttemptedSettlement
        assert.isFalse(investmentAfter5[6]);                        // CompletedSettlement

        investmentAfter6[2].should.be.bignumber.equal(web3.toWei(6, 'ether'));  // Amount
        assert.isFalse(investmentAfter6[4]);                    // Confirmed
        assert.isFalse(investmentAfter6[5]);                    // AttemptedSettlement
        assert.isFalse(investmentAfter6[6]);                    // CompletedSettlement
    });

    it('should fail, because we try to settle an already settled investement again', async () => {
        await expectThrow(icoCrowdsaleInstance.settleInvestment(2, {from: activeInvestor2, gas: 1000000}));
    });

    it('should run settleBatchInvestment successfully', async () => {
        const investment2   = await icoCrowdsaleInstance.investments(2);
        const investment3   = await icoCrowdsaleInstance.investments(3);
        const investment4   = await icoCrowdsaleInstance.investments(4);
        const investment5   = await icoCrowdsaleInstance.investments(5);
        const investment6   = await icoCrowdsaleInstance.investments(6);

        investment2[2].should.be.bignumber.equal(web3.toWei(2, 'ether'));   // Amount
        assert.isTrue(investment2[4]);                   // Confirmed
        assert.isTrue(investment2[5]);                   // AttemptedSettlement
        assert.isTrue(investment2[6]);                   // CompletedSettlement

        investment3[2].should.be.bignumber.equal(web3.toWei(3, 'ether')); // Amount
        assert.isTrue(investment3[4]);                  // Confirmed
        assert.isFalse(investment3[5]);                 // AttemptedSettlement
        assert.isFalse(investment3[6]);                 // CompletedSettlement

        investment4[2].should.be.bignumber.equal(web3.toWei(4, 'ether')); // Amount
        assert.isTrue(investment4[4]);                  // Confirmed
        assert.isFalse(investment4[5]);                 // AttemptedSettlement
        assert.isFalse(investment4[6]);                 // CompletedSettlement

        investment5[2].should.be.bignumber.equal(web3.toWei(5, 'ether')); // Amount
        assert.isFalse(investment5[4]);                     // Confirmed
        assert.isFalse(investment5[5]);                     // AttemptedSettlement
        assert.isFalse(investment5[6]);                     // CompletedSettlement

        investment6[2].should.be.bignumber.equal(web3.toWei(6, 'ether'));   // Amount
        assert.isFalse(investment6[4]);                     // Confirmed
        assert.isFalse(investment6[5]);                     // AttemptedSettlement
        assert.isFalse(investment6[6]);                     // CompletedSettlement

        await icoCrowdsaleInstance.batchSettleInvestments([3, 4]);

        const investmentAfter2   = await icoCrowdsaleInstance.investments(2);
        const investmentAfter3   = await icoCrowdsaleInstance.investments(3);
        const investmentAfter4   = await icoCrowdsaleInstance.investments(4);
        const investmentAfter5   = await icoCrowdsaleInstance.investments(5);
        const investmentAfter6   = await icoCrowdsaleInstance.investments(6);

        investmentAfter2[2].should.be.bignumber.equal(web3.toWei(2, 'ether'));  // Amount
        assert.isTrue(investmentAfter2[4]);                  // Confirmed
        assert.isTrue(investmentAfter2[5]);                  // AttemptedSettlement
        assert.isTrue(investmentAfter2[6]);                  // CompletedSettlement

        investmentAfter3[2].should.be.bignumber.equal(web3.toWei(3, 'ether'));   // Amount
        assert.isTrue(investmentAfter3[4]);                    // Confirmed
        assert.isTrue(investmentAfter3[5]);                    // AttemptedSettlement
        assert.isTrue(investmentAfter3[6]);                    // CompletedSettlement

        investmentAfter4[2].should.be.bignumber.equal(web3.toWei(4, 'ether'));   // Amount
        assert.isTrue(investmentAfter4[4]);                    // Confirmed
        assert.isTrue(investmentAfter4[5]);                    // AttemptedSettlement
        assert.isTrue(investmentAfter4[6]);                    // CompletedSettlement

        investmentAfter5[2].should.be.bignumber.equal(web3.toWei(5, 'ether'));    // Amount
        assert.isFalse(investmentAfter5[4]);                        // Confirmed
        assert.isFalse(investmentAfter5[5]);                        // AttemptedSettlement
        assert.isFalse(investmentAfter5[6]);                        // CompletedSettlement

        investmentAfter6[2].should.be.bignumber.equal(web3.toWei(6, 'ether'));  // Amount
        assert.isFalse(investmentAfter6[4]);                    // Confirmed
        assert.isFalse(investmentAfter6[5]);                    // AttemptedSettlement
        assert.isFalse(investmentAfter6[6]);                    // CompletedSettlement
    });

    it('should run settleInvestment for investment 5 (not confirmed)', async () => {
        const investment5 = await icoCrowdsaleInstance.investments(5);

        assert.equal(investment5[0], activeInvestor2);      // Investor
        assert.equal(investment5[1], activeInvestor2);      // Beneficiary
        investment5[2].should.be.bignumber.equal(web3.toWei(5, 'ether')); // Amount
        assert.isFalse(investment5[4]);                     // Confirmed
        assert.isFalse(investment5[5]);                     // AttemptedSettlement
        assert.isFalse(investment5[6]);                     // CompletedSettlement

        const etherContractBefore     = await web3.eth.getBalance(icoCrowdsaleInstance.address);
        const etherWalletBefore       = await web3.eth.getBalance(wallet);
        const etherInvestorBefore     = await web3.eth.getBalance(activeInvestor2);
        const tokenInvestor3Before    = await icoTokenInstance.balanceOf(activeInvestor2);

        await icoCrowdsaleInstance.settleInvestment(5, {from: inactiveInvestor1, gas: 1000000});

        const etherContractAfter      = await web3.eth.getBalance(icoCrowdsaleInstance.address);
        const etherWalletAfter        = await web3.eth.getBalance(wallet);
        const etherInvestorAfter      = await web3.eth.getBalance(activeInvestor2);
        const tokenInvestor3After     = await icoTokenInstance.balanceOf(activeInvestor2);

        etherContractBefore.sub(etherContractAfter).should.be.bignumber.equal(web3.toWei(5, 'ether'));
        etherWalletBefore.should.be.bignumber.equal(etherWalletAfter);
        etherInvestorBefore.add(web3.toWei(5, 'ether')).should.be.bignumber.equal(etherInvestorAfter);
        tokenInvestor3Before.should.be.bignumber.equal(tokenInvestor3After);
        tokenInvestor3Before.should.be.bignumber.equal(5);
    });

    it('should call finalize successfully', async () => {
        await icoCrowdsaleInstance.token();

        let paused = await icoTokenInstance.paused();
        await icoTokenInstance.owner();
        const isTreasurerBefore = await icoTokenInstance.isTreasurer(icoCrowdsaleInstance.address);

        assert.isTrue(isTreasurerBefore);
        assert.isTrue(paused);

        await icoCrowdsaleInstance.finalize();

        paused = await icoTokenInstance.paused();
        assert.isFalse(paused);

        const isTreasurerAfter = await icoTokenInstance.isTreasurer(icoCrowdsaleInstance.address);
        await icoTokenInstance.owner();

        assert.isFalse(isTreasurerAfter);
    });

    it('should not mint more tokens after finalize()', async () => {
        await expectThrow(icoTokenInstance.mint(owner, 1, {from: owner, gas: 1000000}));
    });

    it('should settle unconfirmed investment non non-payable beneficiary wallet (token contract)', async () => {
        await web3.eth.getBalance(icoCrowdsaleInstance.address);
        await icoCrowdsaleInstance.batchSettleInvestments([6, 7]);
        await web3.eth.getBalance(icoCrowdsaleInstance.address);

        const investmentAfter = await icoCrowdsaleInstance.investments(7);

        investmentAfter[2].should.be.bignumber.equal(web3.toWei(7, 'ether'));   // Amount
        assert.isFalse(investmentAfter[4]);                                     // Confirmed
        assert.isTrue(investmentAfter[5]);                                      // AttemptedSettlement
    });
});
