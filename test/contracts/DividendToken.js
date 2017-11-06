/**
 * Contract artifacts
 */
const DividendToken = artifacts.require('./DividendToken');

/**
 * Expect exception throw above call of assertJump()
 *
 * @param {string} error Expected error
 * @return {undefined}
 */
function assertJump(error) { // eslint-disable-line
    assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
}

contract('DividendToken', (accounts) => {
    const owner                 = accounts[0];
    const activeTreasurer1      = accounts[1];
    const activeTreasurer2      = accounts[2];
    const inactiveTreasurer1    = accounts[3];
    const inactiveTreasurer2    = accounts[4];
    // const tokenHolder1  = accounts[3];
    // const tokenHolder2  = accounts[4];

    it('is instantiated correctly', async () => {
        const dividendTokenInstance = await DividendToken.deployed();

        const isOwnerTreasurer    = await dividendTokenInstance.isTreasurer(owner);
        const isOwnerAccountZero  = await dividendTokenInstance.owner() === owner;

        assert.isTrue(isOwnerAccountZero, 'Owner should be the first account');
        assert.isTrue(isOwnerTreasurer, 'Owner should be a treasurer');
    });

    it('Should add treasurer accounts successfully', async () => {
        const dividendTokenInstance = await DividendToken.deployed();

        await dividendTokenInstance.setTreasurer(activeTreasurer1, true);
        await dividendTokenInstance.setTreasurer(activeTreasurer2, true);
        await dividendTokenInstance.setTreasurer(inactiveTreasurer1, false);
        await dividendTokenInstance.setTreasurer(inactiveTreasurer2, false);

        const treasurer1 = await dividendTokenInstance.isTreasurer(activeTreasurer1);
        const treasurer2 = await dividendTokenInstance.isTreasurer(activeTreasurer2);
        const treasurer3 = await dividendTokenInstance.isTreasurer(inactiveTreasurer1);
        const treasurer4 = await dividendTokenInstance.isTreasurer(inactiveTreasurer2);

        assert.isTrue(treasurer1, 'Treasurer 1 should be active');
        assert.isTrue(treasurer2, 'Treasurer 2 should be active');
        assert.isFalse(treasurer3, 'Treasurer 3 should be inactive');
        assert.isFalse(treasurer4, 'Treasurer 4 should be inactive');
    });

    // it.skip('', async () => {

    // });

    //     let tx                    = await insuranceInstance.payIn({ value: 1e17 });
    //     insured                   = await insuranceInstance.isInsured(accounts[0]);
});
