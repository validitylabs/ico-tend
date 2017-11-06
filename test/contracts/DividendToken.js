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
    // const tokenHolder1  = accounts[3];
    // const tokenHolder2  = accounts[4];

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

    it('Should start a new dividend round', async () => {
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

    it('Should fail, because increase dividend cycle is not over', async () => {
        const dividendTokenInstance = await DividendToken.deployed();
        // @TODO: @see DividendToken:166
        try {
            const tx = await web3.eth.sendTransaction({
                from: owner,
                to: dividendTokenInstance.address,
                value: web3.toWei(1, 'ether'),
                gas: 200000
            });

            assert.fail('should have thrown before');
        } catch (e) {
            assertJump(e);
        }
    });

    // it('', async () => {

    // });

    //     let tx                    = await insuranceInstance.payIn({ value: 1e17 });
    //     insured                   = await insuranceInstance.isInsured(accounts[0]);
});
