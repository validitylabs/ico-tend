/**
 * Contract artifacts
 * @TODO: Ensure 100% code coverage
 * @TODO: Write test.md -> describe procedure (it())
 * @TODO: Write event test
 */

const IcoToken      = artifacts.require('./IcoToken');
const moment        = require('moment'); // eslint-disable-line
const BigNumber     = web3.BigNumber;
const assertJump    = require('./helpers/assertJump');

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

    return time.result;
}

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

        await icoTokenInstance.mint(tokenHolder1, 5);
        await icoTokenInstance.mint(tokenHolder2, 5);
        await icoTokenInstance.mint(tokenHolder3, 5);

        balanceTokenHolder1 = await icoTokenInstance.balanceOf(tokenHolder1);
        balanceTokenHolder2 = await icoTokenInstance.balanceOf(tokenHolder2);
        balanceTokenHolder3 = await icoTokenInstance.balanceOf(tokenHolder3);
        totalSupply         = await icoTokenInstance.totalSupply();

        assert.equal(balanceTokenHolder1, 5, 'Wrong token balance of tokenHolder1 (is not 5): ' + balanceTokenHolder1);
        assert.equal(balanceTokenHolder2, 5, 'Wrong token balance of tokenHolder2 (is not 5): ' + balanceTokenHolder2);
        assert.equal(balanceTokenHolder3, 5, 'Wrong token balance of tokenHolder3 (is not 5): ' + balanceTokenHolder3);
        assert.equal(totalSupply, 15, 'Wrong total supply (is not 15): ' + totalSupply);
    });

    it('should start a new dividend round with a balance of 30 eth', async () => {
        // At this point, the contract should not have any ETH
        web3.eth.getBalance(icoTokenInstance.address).should.be.bignumber.equal(web3.toWei(0, 'ether'));

        // Initialize first dividend round with a volume of 10 eth
        await icoTokenInstance.sendTransaction({
            from:   activeTreasurer1,
            value:  web3.toWei(30, 'ether'),
            gas:    200000
        });

        const icoBalance        = await icoTokenInstance.currentDividend();
        const endTime           = await icoTokenInstance.endTime();
        const expectedBalance   = web3.toWei(30, 'ether');

        icoBalance.should.be.bignumber.equal(expectedBalance);
        web3.eth.getBalance(icoTokenInstance.address).should.be.bignumber.equal(expectedBalance);

        // @TODO: Test dividend end time more exclicit with MomentJS
        assert.isTrue(endTime.gt(0), 'EndTime not properly setted: ' + endTime);
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

    it('should claim tokens', async () => {
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
    });

    it('should transfer dividend of tokenHolder1 to tokenHolder2 using the transfer method', async () => {
        const tokenHolder1Balance1                  = await icoTokenInstance.balanceOf(tokenHolder1);
        const tokenHolder2Balance1                  = await icoTokenInstance.balanceOf(tokenHolder2);
        const tokenHolder1UnclaimedDividendBefore   = await icoTokenInstance.unclaimedDividend(tokenHolder1);
        const tokenHolder2UnclaimedDividendBefore   = await icoTokenInstance.unclaimedDividend(tokenHolder2);

        await icoTokenInstance.transfer(tokenHolder2, 5, {from: tokenHolder1});

        const tokenHolder2Balance2                  = await icoTokenInstance.balanceOf(tokenHolder2);
        const tokenHolder1UnclaimedDividendAfter    = await icoTokenInstance.unclaimedDividend(tokenHolder1);
        const tokenHolder2UnclaimedDividendAfter    = await icoTokenInstance.unclaimedDividend(tokenHolder2);

        tokenHolder1UnclaimedDividendBefore.should.be.bignumber.equal(tokenHolder1UnclaimedDividendAfter);
        tokenHolder2UnclaimedDividendBefore.should.be.bignumber.equal(tokenHolder2UnclaimedDividendAfter);
        tokenHolder2Balance1.plus(tokenHolder1Balance1).should.be.bignumber.equal(tokenHolder2Balance2);
    });

    it('should transfer dividend of tokenHolder2 back to tokenHolder1 using the transferFrom method', async () => {
        // const tokenHolder1Balance1  = await icoTokenInstance.balanceOf(tokenHolder1);
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

        // console.log(tokenHolder1Balance1);
        // console.log(tokenHolder1Balance2);
        // console.log('------------------');
        // console.log(tokenHolder2Balance1);
        // console.log(tokenHolder2Balance2);
        // console.log('------------------');
        // console.log(tokenHolder3Balance1);
        // console.log(tokenHolder3Balance2);

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
        // @TODO: test the timestamps
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
        const balance1Contract      = web3.eth.getBalance(icoTokenInstance.address);
        const balance1Owner         = web3.eth.getBalance(owner);
        const balance1TokenHolder1  = web3.eth.getBalance(tokenHolder1);
        const balance1TokenHolder2  = web3.eth.getBalance(tokenHolder2);
        const balance1TokenHolder3  = web3.eth.getBalance(tokenHolder3);

        console.log(
            balance1Contract.toNumber(),
            balance1Owner.toNumber(),
            balance1TokenHolder1.toNumber(),
            balance1TokenHolder2.toNumber(),
            balance1TokenHolder3.toNumber()
        );

        await icoTokenInstance.requestUnclaimed({from: owner});

        const balance2Contract      = web3.eth.getBalance(icoTokenInstance.address);
        const balance2Owner         = web3.eth.getBalance(owner);
        const balance2TokenHolder1  = web3.eth.getBalance(tokenHolder1);
        const balance2TokenHolder2  = web3.eth.getBalance(tokenHolder2);
        const balance2TokenHolder3  = web3.eth.getBalance(tokenHolder3);

        console.log(
            balance2Contract.toNumber(),
            balance2Owner.toNumber(),
            balance2TokenHolder1.toNumber(), balance2TokenHolder2.toNumber(),
            balance2TokenHolder3.toNumber()
        );

        balance2Contract.should.be.bignumber.equal(0);
        balance2TokenHolder1.should.be.bignumber.equal(balance1TokenHolder1);
        balance2TokenHolder2.should.be.bignumber.equal(balance1TokenHolder2);
        balance2TokenHolder3.should.be.bignumber.equal(balance1TokenHolder3);
    });

    // @TODO: implement requestUnclaimed test, after tokenHolder payout

    /**
     * [ Dividend cycle is over ]
     */

    it('should turn the time 20 days forward', async () => {
        console.log('[ Dividend cycle is over ]'.yellow);
        await waitNDays(20);
        // @TODO: test the timestamps
    });

    // @TODO: Test new dividend round payin
});
