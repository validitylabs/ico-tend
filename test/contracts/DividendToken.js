/**
 * Contract artifacts
 */
var moment = require('moment');

const DividendToken = artifacts.require('./DividendToken');
const dividendCycle = 350;
const claimPeriod   = 330;
const reclaimPeriod = 20;

// function getNow() {
//     return new Date().getTime();
// }

// function toSeconds(days) {
//     return days * 60 * 60 * 24;
// }

// function toDays(seconds) {
//     return Math.ceil(seconds / 60 / 60 / 24);
// }

/**
 * Expect exception throw above call of assertJump()
 *
 * @param {string} error Expected error
 * @return {undefined}
 */
function assertJump(error) { // eslint-disable-line
    assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
}

/**
 * Increase N days in testrpc
 * await waitNDays(int days);
 * @param integer days
 */
async function waitNDays(days) {
    let daysInSeconds = days * 24 * 60 * 60;

    await web3.currentProvider.send({
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [daysInSeconds],
        id: 4447
    })
}

contract('DividendToken', (accounts) => {
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

    it('Should instantiate the dividend token correctly', async () => {
        const dividendTokenInstance = await DividendToken.deployed();

        const isOwnerTreasurer    = await dividendTokenInstance.isTreasurer(owner);
        const isOwnerAccountZero  = await dividendTokenInstance.owner() === owner;

        assert.isTrue(isOwnerAccountZero, 'Owner is not the first account');
        assert.isTrue(isOwnerTreasurer, 'Owner is not a treasurer');
    });

    it('Should add treasurer accounts', async () => {
        const dividendTokenInstance = await DividendToken.deployed();

        await dividendTokenInstance.setTreasurer(activeTreasurer1, true);
        await dividendTokenInstance.setTreasurer(activeTreasurer2, true);
        await dividendTokenInstance.setTreasurer(inactiveTreasurer1, false);
        await dividendTokenInstance.setTreasurer(inactiveTreasurer2, false);

        const treasurer1 = await dividendTokenInstance.isTreasurer(activeTreasurer1);
        const treasurer2 = await dividendTokenInstance.isTreasurer(activeTreasurer2);
        const treasurer3 = await dividendTokenInstance.isTreasurer(inactiveTreasurer1);
        const treasurer4 = await dividendTokenInstance.isTreasurer(inactiveTreasurer2);

        assert.isTrue(treasurer1, 'Treasurer 1 is not active');
        assert.isTrue(treasurer2, 'Treasurer 2 is not active');
        assert.isFalse(treasurer3, 'Treasurer 3 is not inactive');
        assert.isFalse(treasurer4, 'Treasurer 4 is not inactive');
    });

    it('Should start a new dividend round with a balance of 10 eth', async () => {
        const dividendTokenInstance = await DividendToken.deployed();

        // Initialize first dividend round with a volume of 10 eth
        const tx = await web3.eth.sendTransaction({
            from: owner,
            to: dividendTokenInstance.address,
            value: web3.toWei(10, 'ether'),
            gas: 200000
        });

        // Get ICO balance
        const icoBalance    = await dividendTokenInstance.currentDividend();
        const endTime       = await dividendTokenInstance.endTime();

        assert.equal(web3.fromWei(icoBalance.toNumber()), 10, 'dividend balance is not equal to 10 eth');

        // @TODO: Test dividend end time more exclicit with MomentJS
        assert.isTrue(endTime > 0, 'EndTime not properly setted');
    });

    it('Should increase dividend balance to 30 eth with different authorized accounts', async () => {
        const dividendTokenInstance = await DividendToken.deployed();

        // Increase dividend as owner
        await web3.eth.sendTransaction({
            from: owner,
            to: dividendTokenInstance.address,
            value: web3.toWei(10, 'ether'),
            gas: 200000
        });

        // Increase dividend as treasurer
        await web3.eth.sendTransaction({
            from: activeTreasurer1,
            to: dividendTokenInstance.address,
            value: web3.toWei(10, 'ether'),
            gas: 200000
        });

        // Get ICO balance
        const icoBalance = await dividendTokenInstance.currentDividend();

        assert.equal(web3.fromWei(icoBalance.toNumber()), 30, 'dividend balance is not equal to 30 eth');
    });

    it('Should fail, because we try to increase dividend balance with a non treasurer account', async () => {
        const dividendTokenInstance = await DividendToken.deployed();

        try {
            const tx = await web3.eth.sendTransaction({
                from: tokenHolder1,
                to: dividendTokenInstance.address,
                value: web3.toWei(1, 'ether'),
                gas: 200000
            });

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('Should fail, because we try to increase dividend balance with a deactivated treasurer account', async () => {
        const dividendTokenInstance = await DividendToken.deployed();

        try {
            const tx = await web3.eth.sendTransaction({
                from: inactiveTreasurer1,
                to: dividendTokenInstance.address,
                value: web3.toWei(1, 'ether'),
                gas: 200000
            });

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('Should fail, because requestUnclaimed() is called, but the reclaim period has not begun.', async () => {
        const dividendTokenInstance = await DividendToken.deployed();

        try {
            await dividendTokenInstance.requestUnclaimed({from: owner});

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    it('Should transfer 5 dividend tokens to each token holder', async () => {
        const dividendTokenInstance = await DividendToken.deployed();

        // let unclaimedDividend = await dividendTokenInstance.unclaimedDividend(tokenHolder1);
        // console.log(unclaimedDividend.toNumber());

        // let tx = await dividendTokenInstance.transferFrom(dividendTokenInstance.address, tokenHolder1, 5);
        // console.log(tx);

        const totalSupply = await dividendTokenInstance.totalSupply();
        console.log(totalSupply.toNumber());

        // const claimed = await dividendTokenInstance.claimDividend({from: tokenHolder1});
        // // assert.isTrue(claimed, 'claimDividend did not succeeded');

        // let unclaimedDividend = await dividendTokenInstance.unclaimedDividend(tokenHolder1);
        // console.log(unclaimedDividend.toNumber());

        // await dividendTokenInstance.claimDividend({from: tokenHolder1});

        // unclaimedDividend = await dividendTokenInstance.unclaimedDividend(tokenHolder1);
        // console.log(unclaimedDividend.toNumber());
    });

    // it('', async () => {

    // });

    /**
     * [ Claim period is over ]
     */
    it('Should reach the end of claim period successfully', async () => {
        await waitNDays(330);
    });

    /**
     * [ Reclaim period is over ]
     */
    it('Should reach the end of reclaim period successfully', async () => {
        await waitNDays(20);
    });

});
