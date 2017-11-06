/**
 * Contract artifacts
 */
let moment = require('moment'); // eslint-disable-line

const IcoToken = artifacts.require('./IcoToken');

const dividendCycle = 350;
const claimPeriod   = 330;
const reclaimPeriod = 20;

/**
 * Expect exception throw above call of assertJump()
 *
 * @param {string} error Expected error
 * @return {undefined}
 */
function assertJump(error) {
    assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
}

/**
 * Increase N days in testrpc
 *
 * @param {integer} days Number of days
 * @return {undefined}
 */
async function waitNDays(days) {
    const daysInSeconds = days * 24 * 60 * 60;

    await web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [daysInSeconds],
        id: 4447
    });
}

contract('IcoToken', (accounts) => {
    // Provide a fresh instance for each test run
    let icoTokenInstance;
    beforeEach(() => {
        return IcoToken.new().then((instance) => {
            icoTokenInstance = instance;
        });
    });

    const owner                 = accounts[0];
    const activeTreasurer1      = accounts[1];
    const activeTreasurer2      = accounts[2];
    const inactiveTreasurer1    = accounts[3];
    const inactiveTreasurer2    = accounts[4];
    const tokenHolder1          = accounts[5];
    const tokenHolder2          = accounts[6];

    /**
     * [ Dividend cycle has just begun ]
     */

    it('should instantiate the ICO token correctly', async () => {
        const isOwnerTreasurer      = await icoTokenInstance.isTreasurer(owner);
        const isOwnerAccountZero    = await icoTokenInstance.owner() === owner;

        assert.isTrue(isOwnerAccountZero, 'Owner is not the first account');
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

    it('should start a new dividend round with a balance of 10 eth', async () => {
        // Initialize first dividend round with a volume of 10 eth
        await web3.eth.sendTransaction({
            from: owner,
            to: icoTokenInstance.address,
            value: web3.toWei(10, 'ether'),
            gas: 200000
        });

        // Get ICO balance
        const icoBalance    = await icoTokenInstance.currentDividend();
        const endTime       = await icoTokenInstance.endTime();

        assert.equal(web3.fromWei(icoBalance.toNumber()), 10, 'dividend balance is not equal to 10 eth');

        // @TODO: Test dividend end time more exclicit with MomentJS
        assert.isTrue(endTime > 0, 'EndTime not properly setted');
    });

    it('should increase dividend balance to 30 eth with different authorized accounts', async () => {
        // Increase dividend as owner
        await web3.eth.sendTransaction({
            from: owner,
            to: icoTokenInstance.address,
            value: web3.toWei(10, 'ether'),
            gas: 200000
        });

        // @FIXME:
        // Increase dividend as treasurer
        // await web3.eth.sendTransaction({
        //     from: activeTreasurer1,
        //     to: icoTokenInstance.address,
        //     value: web3.toWei(10, 'ether'),
        //     gas: 200000
        // });

        // Get ICO balance
        // const icoBalance = await icoTokenInstance.currentDividend();

        // assert.equal(web3.fromWei(icoBalance.toNumber()), 30, 'dividend balance is not equal to 30 eth');
    });

    it('should fail, because we try to increase dividend balance with a non treasurer account', async () => {
        try {
            await web3.eth.sendTransaction({
                from: tokenHolder1,
                to: icoTokenInstance.address,
                value: web3.toWei(1, 'ether'),
                gas: 200000
            });

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('should fail, because we try to increase dividend balance with a deactivated treasurer account', async () => {
        try {
            await web3.eth.sendTransaction({
                from: inactiveTreasurer1,
                to: icoTokenInstance.address,
                value: web3.toWei(1, 'ether'),
                gas: 200000
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

    it('should mint tokens for the token holders', async () => {
        let balanceTokenHolder1 = await icoTokenInstance.balanceOf(tokenHolder1);
        let balanceTokenHolder2 = await icoTokenInstance.balanceOf(tokenHolder2);
        let totalSupply         = await icoTokenInstance.totalSupply();

        assert.equal(balanceTokenHolder1, 0, 'Token balance of tokenHolder1 is not 0');
        assert.equal(balanceTokenHolder2, 0, 'Token balance of tokenHolder2 is not 0');
        assert.equal(totalSupply, 0, 'Total supply is not 0');

        await icoTokenInstance.mint(tokenHolder1, 5);
        await icoTokenInstance.mint(tokenHolder2, 5);

        balanceTokenHolder1 = await icoTokenInstance.balanceOf(tokenHolder1);
        balanceTokenHolder2 = await icoTokenInstance.balanceOf(tokenHolder2);
        totalSupply         = await icoTokenInstance.totalSupply();

        assert.equal(balanceTokenHolder1, 5, 'Token balance of tokenHolder1 is not 5');
        assert.equal(balanceTokenHolder2, 5, 'Token balance of tokenHolder2 is not 5');
        assert.equal(totalSupply, 10, 'Total supply is not 10');
    });

    it.skip('should transfer 5 dividend tokens to each token holder', async () => {
        // let unclaimedDividend = await icoTokenInstance.unclaimedDividend(tokenHolder1);
        // console.log(unclaimedDividend.toNumber());

        // minten token for tokenHolder1
        // tokens da?
        // einzahlung dividend

        // let tx = await icoTokenInstance.transferFrom(icoTokenInstance.address, tokenHolder1, 5);
        // console.log(tx);

        // const tokenHolder1Balance1  = await icoTokenInstance.balanceOf(tokenHolder1);
        // const totalSupply1          = await icoTokenInstance.totalSupply();

        // console.log(totalSupply1.toNumber());
        // console.log(tokenHolder1Balance1.toNumber());

        // await icoTokenInstance.approve(address _spender, uint256 _value)
        // await icoTokenInstance.transfer(tokenHolder1, 5);

        // const tokenHolder1Balance2  = await icoTokenInstance.balanceOf(tokenHolder1);
        // const totalSupply2          = await icoTokenInstance.totalSupply();

        // console.log(totalSupply2.toNumber());
        // console.log(tokenHolder1Balance2.toNumber());

        // const claimed = await icoTokenInstance.claimDividend({from: tokenHolder1});
        // // assert.isTrue(claimed, 'claimDividend did not succeeded');

        // let unclaimedDividend = await icoTokenInstance.unclaimedDividend(tokenHolder1);
        // console.log(unclaimedDividend.toNumber());

        // await icoTokenInstance.claimDividend({from: tokenHolder1});

        // unclaimedDividend = await icoTokenInstance.unclaimedDividend(tokenHolder1);
        // console.log(unclaimedDividend.toNumber());
    });

    // it('', async () => {

    // });

    /**
     * [ Claim period is over ]
     */
    it.skip('should reach the end of claim period successfully', async () => {
        await waitNDays(330);
    });

    /**
     * [ Reclaim period is over ]
     */
    it.skip('should reach the end of reclaim period successfully', async () => {
        await waitNDays(20);
    });
});
