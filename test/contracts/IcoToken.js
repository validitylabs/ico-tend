/**
 * Contract artifacts
 * @TODO: Write test.md -> describe procedure (it()) -> verboser nested <UL> mit asserts
 */

const IcoToken      = artifacts.require('./IcoToken');
const moment        = require('moment'); // eslint-disable-line
const BigNumber     = web3.BigNumber;
const assertJump    = require('./helpers/assertJump');
let timestamp       = Math.floor(Date.now() / 1000);

const should = require('chai') // eslint-disable-line
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

/**
 * Increase N days in testrpc
 *
 * @param {integer} days Number of days
 * @return {integer} Time
 */
async function waitNDays(days) {
    const daysInSeconds = days * 24 * 60 * 60;

    const time = await web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [daysInSeconds],
        id: 4447
    });

    // @TODO: Transform to icoTokenInstance.endTime() format
    // time:                            60480000
    // endTime.toNumber() / Date.now(): 1600936260
    timestamp = time.result;

    return time.result;
}

/**
 * Get event from transaction
 *
 * @param {object} tx Transaction object
 * @param {string} event Event searching for
 * @returns {object} Event stack
 */
function getEvents(tx, event = null) {
    const stack = [];

    tx.logs.forEach((item) => {
        if (event) {
            if (event === item.event) {
                stack.push(item.args);
            }
        } else {
            if (!stack[item.event]) {
                stack[item.event] = [];
            }
            stack[item.event].push(item.args);
        }
    });

    return stack;
}

/**
 * Debug helper
 *
 * @param {IcoToken} icoTokenInstance Instance of IcoToken
 * @param {string} tokenHolder1 Tokenholder1
 * @param {string} tokenHolder2 Tokenholder2
 * @param {string} tokenHolder3 Tokenholder3
 * @param {string} owner Owner
 * @param {string} activeTreasurer1 Active treasurer
 * @returns {undefined}
 */
async function debug(icoTokenInstance, tokenHolder1, tokenHolder2, tokenHolder3, owner, activeTreasurer1) { // eslint-disable-line
    const tokenHolder1Token  = await icoTokenInstance.balanceOf(tokenHolder1);
    const tokenHolder2Token  = await icoTokenInstance.balanceOf(tokenHolder2);
    const tokenHolder3Token  = await icoTokenInstance.balanceOf(tokenHolder3);
    const ownerToken  = await icoTokenInstance.balanceOf(owner);
    const activeTreasurer1Token  = await icoTokenInstance.balanceOf(activeTreasurer1);

    const fundsHolder1Eth = web3.eth.getBalance(tokenHolder1);
    const fundsHolder2Eth = web3.eth.getBalance(tokenHolder2);
    const fundsHolder3Eth = web3.eth.getBalance(tokenHolder3);
    const ownerEth = web3.eth.getBalance(owner);
    const activeTreasurer1Eth = web3.eth.getBalance(activeTreasurer1);
    const contractEth = web3.eth.getBalance(icoTokenInstance.address);

    console.log('====================================');
    console.log('ACCOUNT | ETH | TOKEN');
    console.log('------------------------------------');
    console.log('CONTRCT | ' + Math.ceil(contractEth / 1e18) + ' | ');
    console.log('TREASUR | ' + Math.ceil(activeTreasurer1Eth / 1e18) + ' | ' + activeTreasurer1Token.toNumber());
    console.log('OWNER   | ' + Math.ceil(ownerEth / 1e18) + ' | ' + ownerToken.toNumber());
    console.log('USER 1  | ' + Math.ceil(fundsHolder1Eth / 1e18) + ' | ' + tokenHolder1Token.toNumber());
    console.log('USER 2  | ' + Math.ceil(fundsHolder2Eth / 1e18) + ' | ' + tokenHolder2Token.toNumber());
    console.log('USER 3  | ' + Math.ceil(fundsHolder3Eth / 1e18) + ' | ' + tokenHolder3Token.toNumber());
    console.log('====================================');
}

/**
 * IcoToken contract
 */
contract('IcoToken', (accounts) => {
    const owner                 = accounts[0];
    const activeTreasurer1      = accounts[1];
    const activeTreasurer2      = accounts[2];
    const inactiveTreasurer1    = accounts[3];
    const inactiveTreasurer2    = accounts[4];
    const tokenHolder1          = accounts[5];
    const tokenHolder2          = accounts[6];
    const tokenHolder3          = accounts[7];

    // Provide icoTokenInstance for every test case
    let icoTokenInstance;
    beforeEach(async () => {
        icoTokenInstance = await IcoToken.deployed();
    });

    /**
     * [ Claim period ]
     */

    it('should instantiate the ICO token correctly', async () => {
        console.log('[ Claim period ]'.yellow);

        const isOwnerTreasurer      = await icoTokenInstance.isTreasurer(owner);
        const isOwnerAccountZero    = await icoTokenInstance.owner() === owner;

        assert.isTrue(isOwnerAccountZero, 'Owner is not the first account: ' + icoTokenInstance.owner());
        assert.isTrue(isOwnerTreasurer, 'Owner is not a treasurer');
    });

    it('should add treasurer accounts', async () => {
        await icoTokenInstance.setTreasurer(activeTreasurer1, true);
        await icoTokenInstance.setTreasurer(activeTreasurer2, true);
        await icoTokenInstance.setTreasurer(inactiveTreasurer1, false);
        await icoTokenInstance.setTreasurer(inactiveTreasurer2, false);

        const treasurer1 = await icoTokenInstance.isTreasurer(activeTreasurer1);
        const treasurer2 = await icoTokenInstance.isTreasurer(activeTreasurer2);
        const treasurer3 = await icoTokenInstance.isTreasurer(inactiveTreasurer1);
        const treasurer4 = await icoTokenInstance.isTreasurer(inactiveTreasurer2);

        assert.isTrue(treasurer1, 'Treasurer 1 is not active');
        assert.isTrue(treasurer2, 'Treasurer 2 is not active');
        assert.isFalse(treasurer3, 'Treasurer 3 is not inactive');
        assert.isFalse(treasurer4, 'Treasurer 4 is not inactive');
    });

    it('should mint 5 tokens for each token holder', async () => {
        let balanceTokenHolder1 = await icoTokenInstance.balanceOf(tokenHolder1);
        let balanceTokenHolder2 = await icoTokenInstance.balanceOf(tokenHolder2);
        let balanceTokenHolder3 = await icoTokenInstance.balanceOf(tokenHolder3);
        let totalSupply         = await icoTokenInstance.totalSupply();

        assert.equal(balanceTokenHolder1, 0, 'Wrong token balance of tokenHolder1 (is not 0): ' + balanceTokenHolder1);
        assert.equal(balanceTokenHolder2, 0, 'Wrong token balance of tokenHolder2 (is not 0): ' + balanceTokenHolder2);
        assert.equal(balanceTokenHolder3, 0, 'Wrong token balance of tokenHolder3 (is not 0): ' + balanceTokenHolder3);
        assert.equal(totalSupply, 0, 'Wrong total supply (is not 0): ' + totalSupply);

        const tx1 = await icoTokenInstance.mint(tokenHolder1, 5);
        const tx2 = await icoTokenInstance.mint(tokenHolder2, 5);
        const tx3 = await icoTokenInstance.mint(tokenHolder3, 5);

        balanceTokenHolder1 = await icoTokenInstance.balanceOf(tokenHolder1);
        balanceTokenHolder2 = await icoTokenInstance.balanceOf(tokenHolder2);
        balanceTokenHolder3 = await icoTokenInstance.balanceOf(tokenHolder3);
        totalSupply         = await icoTokenInstance.totalSupply();

        assert.equal(balanceTokenHolder1, 5, 'Wrong token balance of tokenHolder1 (is not 5): ' + balanceTokenHolder1);
        assert.equal(balanceTokenHolder2, 5, 'Wrong token balance of tokenHolder2 (is not 5): ' + balanceTokenHolder2);
        assert.equal(balanceTokenHolder3, 5, 'Wrong token balance of tokenHolder3 (is not 5): ' + balanceTokenHolder3);
        assert.equal(totalSupply, 15, 'Wrong total supply (is not 15): ' + totalSupply);

        // Testing events
        const events1 = getEvents(tx1);
        const events2 = getEvents(tx2);
        const events3 = getEvents(tx3);

        events1.Mint[0].amount.should.be.bignumber.equal(5);
        events2.Mint[0].amount.should.be.bignumber.equal(5);
        events3.Mint[0].amount.should.be.bignumber.equal(5);

        assert.equal(events1.Mint[0].to, tokenHolder1, 'Mint event to address doesn\'t match against tokenHolder1 address');
        assert.equal(events2.Mint[0].to, tokenHolder2, 'Mint event to address doesn\'t match against tokenHolder2 address');
        assert.equal(events3.Mint[0].to, tokenHolder3, 'Mint event to address doesn\'t match against tokenHolder3 address');

        events1.Transfer[0].value.should.be.bignumber.equal(5);
        events2.Transfer[0].value.should.be.bignumber.equal(5);
        events3.Transfer[0].value.should.be.bignumber.equal(5);
    });

    it('should start a new dividend round with a balance of 30 eth', async () => {
        const expectedBalance = web3.toWei(30, 'ether');

        // At this point, the contract should not have any ETH
        web3.eth.getBalance(icoTokenInstance.address).should.be.bignumber.equal(web3.toWei(0, 'ether'));

        // Initialize first dividend round with a volume of 30 eth
        const tx = await icoTokenInstance.sendTransaction({
            from:   activeTreasurer1,
            value:  expectedBalance,
            gas:    200000
        });

        const icoBalance    = await icoTokenInstance.currentDividend();
        const endTime       = await icoTokenInstance.endTime();

        icoBalance.should.be.bignumber.equal(expectedBalance);
        web3.eth.getBalance(icoTokenInstance.address).should.be.bignumber.equal(expectedBalance);

        assert.isTrue(endTime.gt(timestamp), 'EndTime not properly set: ' + endTime);

        // Testing events
        const events = getEvents(tx);

        events.Payin[0]._value.should.be.bignumber.equal(expectedBalance);
        events.Payin[0]._endTime.should.be.bignumber.equal(endTime);
        assert.equal(events.Payin[0]._owner, activeTreasurer1, 'Treasurer doesn\'t match against: ' + activeTreasurer1);
    });

    it('should fail, because we try to increase the dividend again', async () => {
        // At this point, the contract should have 30 ETH
        web3.eth.getBalance(icoTokenInstance.address).should.be.bignumber.equal(web3.toWei(30, 'ether'));

        try {
            await icoTokenInstance.sendTransaction({
                from:   owner,
                value:  web3.toWei(1, 'ether'),
                gas:    200000
            });

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should fail, because we try to increase dividend balance with a non treasurer account', async () => {
        try {
            await icoTokenInstance.sendTransaction({
                from:   tokenHolder1,
                value:  web3.toWei(1, 'ether'),
                gas:    200000
            });

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should fail, because we try to increase dividend balance with a deactivated treasurer account', async () => {
        try {
            await icoTokenInstance.sendTransaction({
                from:   inactiveTreasurer1,
                value:  web3.toWei(1, 'ether'),
                gas:    200000
            });

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should fail, because requestUnclaimed() is called, but the reclaim period has not begun.', async () => {
        try {
            await icoTokenInstance.requestUnclaimed({from: owner});

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should claim dividend (ETH)', async () => {
        const fundsTokenBefore      = web3.eth.getBalance(icoTokenInstance.address);
        const fundsHolder1Before    = web3.eth.getBalance(tokenHolder1);
        const fundsHolder2Before    = web3.eth.getBalance(tokenHolder2);

        const tx1 = await icoTokenInstance.claimDividend({from: tokenHolder1});
        const tx2 = await icoTokenInstance.claimDividend({from: tokenHolder2});

        const unclaimedDividend = await icoTokenInstance.unclaimedDividend(tokenHolder1);

        const fundsTokenAfter   = web3.eth.getBalance(icoTokenInstance.address);
        const fundsHolder1After = web3.eth.getBalance(tokenHolder1);
        const fundsHolder2After = web3.eth.getBalance(tokenHolder2);

        assert.equal(unclaimedDividend, 0, 'Unclaimed dividend should be 0, but is: ' + unclaimedDividend);

        const gasUsed1         = await web3.eth.getTransactionReceipt(tx1.tx).gasUsed;
        const gasPrice1        = await web3.eth.getTransaction(tx1.tx).gasPrice;
        const transactionFee1  = gasPrice1.times(gasUsed1);

        const gasUsed2         = await web3.eth.getTransactionReceipt(tx2.tx).gasUsed;
        const gasPrice2        = await web3.eth.getTransaction(tx2.tx).gasPrice;
        const transactionFee2  = gasPrice2.times(gasUsed2);

        const gas = transactionFee1.plus(transactionFee2);

        (fundsHolder1After.plus(fundsHolder2After))
            .minus((fundsHolder1Before.plus(fundsHolder2Before)))
            .plus(gas).should.be.bignumber.equal(fundsTokenBefore.minus(fundsTokenAfter));

        // Testing events
        const events1 = getEvents(tx1);
        const events2 = getEvents(tx2);

        assert.equal(events1.Payout[0]._tokenHolder, tokenHolder1, 'TokenHolder1 doesn\'t match against Event');
        assert.equal(events2.Payout[0]._tokenHolder, tokenHolder2, 'TokenHolder2 doesn\'t match against Event');

        (fundsHolder1After.plus(fundsHolder2After))
            .minus((fundsHolder1Before.plus(fundsHolder2Before)))
            .plus(gas).should.be.bignumber.equal(events1.Payout[0]._value.plus(events1.Payout[0]._value));
    });

    it('should transfer token of tokenHolder1 to tokenHolder2 using the transfer method', async () => {
        const tokenHolder1Balance1                  = await icoTokenInstance.balanceOf(tokenHolder1);
        const tokenHolder2Balance1                  = await icoTokenInstance.balanceOf(tokenHolder2);
        const tokenHolder1UnclaimedDividendBefore   = await icoTokenInstance.unclaimedDividend(tokenHolder1);
        const tokenHolder2UnclaimedDividendBefore   = await icoTokenInstance.unclaimedDividend(tokenHolder2);

        const tx = await icoTokenInstance.transfer(tokenHolder2, 5, {from: tokenHolder1});

        const tokenHolder2Balance2                  = await icoTokenInstance.balanceOf(tokenHolder2);
        const tokenHolder1UnclaimedDividendAfter    = await icoTokenInstance.unclaimedDividend(tokenHolder1);
        const tokenHolder2UnclaimedDividendAfter    = await icoTokenInstance.unclaimedDividend(tokenHolder2);

        tokenHolder1UnclaimedDividendBefore.should.be.bignumber.equal(tokenHolder1UnclaimedDividendAfter);
        tokenHolder2UnclaimedDividendBefore.should.be.bignumber.equal(tokenHolder2UnclaimedDividendAfter);
        tokenHolder2Balance1.plus(tokenHolder1Balance1).should.be.bignumber.equal(tokenHolder2Balance2);

        // Testing events
        const transferEvents = getEvents(tx, 'Transfer');

        assert.equal(transferEvents[0].from, tokenHolder1, 'Transfer event from address doesn\'t match against tokenHolder1 address');
        assert.equal(transferEvents[0].to, tokenHolder2, 'Transfer event to address doesn\'t match against tokenHolder2 address');
        transferEvents[0].value.should.be.bignumber.equal(5);
    });

    it('should transfer token of tokenHolder2 back to tokenHolder1 using the transferFrom method', async () => {
        const tokenHolder2Balance1  = await icoTokenInstance.balanceOf(tokenHolder2);
        const tokenHolder3Balance1  = await icoTokenInstance.balanceOf(tokenHolder3);

        const allow1 = await icoTokenInstance.allowance(tokenHolder2, tokenHolder1);
        allow1.should.be.bignumber.equal(0);

        await icoTokenInstance.approve(tokenHolder1, 5, {from: tokenHolder2});

        const allow2 = await icoTokenInstance.allowance(tokenHolder2, tokenHolder1);
        allow2.should.be.bignumber.equal(5);

        await icoTokenInstance.transferFrom(tokenHolder2, tokenHolder1, 5, {from: tokenHolder1});

        const tokenHolder1Balance2  = await icoTokenInstance.balanceOf(tokenHolder1);
        const tokenHolder2Balance2  = await icoTokenInstance.balanceOf(tokenHolder2);
        const tokenHolder3Balance2  = await icoTokenInstance.balanceOf(tokenHolder3);

        tokenHolder3Balance1.should.be.bignumber.equal(tokenHolder3Balance2);
        tokenHolder1Balance2.should.be.bignumber.equal(allow2);
        tokenHolder2Balance2.should.be.bignumber.equal(tokenHolder2Balance1.minus(allow2));
    });

    /**
     * [ Reclaim period ]
     */

    it('should turn the time 330 days forward to reclaim period', async () => {
        console.log('[ Reclaim period ]'.yellow);
        await waitNDays(330);
        // @TODO: Check value of timestamps
    });

    it('should fail, because we try to call claimDividend() after the claim period is over', async () => {
        try {
            await icoTokenInstance.claimDividend({from: tokenHolder1});
            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should payout the unclaimed ETH to owner account.', async () => {
        const balance1TokenHolder1  = web3.eth.getBalance(tokenHolder1);
        const balance1TokenHolder2  = web3.eth.getBalance(tokenHolder2);
        const balance1TokenHolder3  = web3.eth.getBalance(tokenHolder3);

        await icoTokenInstance.requestUnclaimed({from: owner});

        const balance2Contract      = web3.eth.getBalance(icoTokenInstance.address);
        const balance2TokenHolder1  = web3.eth.getBalance(tokenHolder1);
        const balance2TokenHolder2  = web3.eth.getBalance(tokenHolder2);
        const balance2TokenHolder3  = web3.eth.getBalance(tokenHolder3);

        balance2Contract.should.be.bignumber.equal(0);
        balance2TokenHolder1.should.be.bignumber.equal(balance1TokenHolder1);
        balance2TokenHolder2.should.be.bignumber.equal(balance1TokenHolder2);
        balance2TokenHolder3.should.be.bignumber.equal(balance1TokenHolder3);
    });

    /**
     * [ First dividend cycle is over, second is started ]
     */

    it('should turn the time 20 days forward', async () => {
        console.log('[ First dividend cycle is over, second is started ]'.yellow);
        await waitNDays(20);
        // @TODO: Check value of timestamps
    });

    it('should start a second dividend round with a balance of 15 eth', async () => {
        // At this point, the contract should not have any ETH
        web3.eth.getBalance(icoTokenInstance.address).should.be.bignumber.equal(web3.toWei(0, 'ether'));

        // Initialize first dividend round with a volume of 15 eth
        await icoTokenInstance.sendTransaction({
            from:   owner,
            value:  web3.toWei(15, 'ether'),
            gas:    200000
        });

        const icoBalance        = await icoTokenInstance.currentDividend();
        const endTime           = await icoTokenInstance.endTime();
        const expectedBalance   = web3.toWei(15, 'ether');

        icoBalance.should.be.bignumber.equal(expectedBalance);
        web3.eth.getBalance(icoTokenInstance.address).should.be.bignumber.equal(expectedBalance);
        assert.isTrue(endTime.gt(timestamp), 'EndTime not properly set: ' + endTime);
    });

    it('should mint 3 tokens for tokenHolder1 and 2 tokens for tokenHolder3', async () => {
        let balanceTokenHolder1 = await icoTokenInstance.balanceOf(tokenHolder1);
        let balanceTokenHolder2 = await icoTokenInstance.balanceOf(tokenHolder2);
        let balanceTokenHolder3 = await icoTokenInstance.balanceOf(tokenHolder3);
        let totalSupply         = await icoTokenInstance.totalSupply();

        assert.equal(balanceTokenHolder1, 5, 'Wrong token balance of tokenHolder1 (is not 5): ' + balanceTokenHolder1);
        assert.equal(balanceTokenHolder2, 5, 'Wrong token balance of tokenHolder2 (is not 5): ' + balanceTokenHolder2);
        assert.equal(balanceTokenHolder3, 5, 'Wrong token balance of tokenHolder3 (is not 5): ' + balanceTokenHolder3);
        assert.equal(totalSupply, 15, 'Wrong total supply (is not 15): ' + totalSupply);

        await icoTokenInstance.mint(tokenHolder1, 3);
        await icoTokenInstance.mint(tokenHolder3, 2);

        balanceTokenHolder1 = await icoTokenInstance.balanceOf(tokenHolder1);
        balanceTokenHolder2 = await icoTokenInstance.balanceOf(tokenHolder2);
        balanceTokenHolder3 = await icoTokenInstance.balanceOf(tokenHolder3);
        totalSupply         = await icoTokenInstance.totalSupply();

        assert.equal(balanceTokenHolder1, 8, 'Wrong token balance of tokenHolder1 (is not 8): ' + balanceTokenHolder1);
        // @FIXME: should balanceTokenHolder2 be 0?
        assert.equal(balanceTokenHolder2, 5, 'Wrong token balance of tokenHolder2 (is not 5): ' + balanceTokenHolder2);
        assert.equal(balanceTokenHolder3, 7, 'Wrong token balance of tokenHolder3 (is not 7): ' + balanceTokenHolder3);
        assert.equal(totalSupply, 20, 'Wrong total supply (is not 20): ' + totalSupply);
    });

    it('should claim dividend (ETH) again', async () => {
        const fundsTokenBefore      = web3.eth.getBalance(icoTokenInstance.address);
        const fundsHolder3Before    = web3.eth.getBalance(tokenHolder3);
        const fundsHolder2Before    = web3.eth.getBalance(tokenHolder2);

        const tx1 = await icoTokenInstance.claimDividend({from: tokenHolder3});
        const tx2 = await icoTokenInstance.claimDividend({from: tokenHolder2});

        const unclaimedDividend = await icoTokenInstance.unclaimedDividend(tokenHolder3);

        const fundsTokenAfter   = web3.eth.getBalance(icoTokenInstance.address);
        const fundsHolder3After = web3.eth.getBalance(tokenHolder3);
        const fundsHolder2After = web3.eth.getBalance(tokenHolder2);

        assert.equal(unclaimedDividend, 0, 'Unclaimed dividend should be 0, but is: ' + unclaimedDividend);

        const gasUsed1         = await web3.eth.getTransactionReceipt(tx1.tx).gasUsed;
        const gasPrice1        = await web3.eth.getTransaction(tx1.tx).gasPrice;
        const transactionFee1  = gasPrice1.times(gasUsed1);

        const gasUsed2         = await web3.eth.getTransactionReceipt(tx2.tx).gasUsed;
        const gasPrice2        = await web3.eth.getTransaction(tx2.tx).gasPrice;
        const transactionFee2  = gasPrice2.times(gasUsed2);

        const gas = transactionFee1.plus(transactionFee2);

        (fundsHolder3After.plus(fundsHolder2After))
            .minus((fundsHolder3Before.plus(fundsHolder2Before)))
            .plus(gas).should.be.bignumber.equal(fundsTokenBefore.minus(fundsTokenAfter));
    });
});
