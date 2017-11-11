/**
 * @const BigNumber Pointer to web3.BigNumber
 */
const BigNumber = web3.BigNumber;
export {BigNumber};

/**
 * Increase N days in testrpc
 *
 * @param {integer} days Number of days
 * @return {integer} Time
 */
export async function waitNDays(days) {
    const daysInSeconds = days * 24 * 60 * 60;

    const time = await web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [daysInSeconds],
        id: 4447
    });

    return time.result;
}

/**
 * Defines a EmptyStackException
 *
 * @param {string} message Exception message
 * @returns {undefined}
 */
function EmptyStackException(message) {
    this.message    = message;
    this.name       = 'EmptyStackException';
}

/**
 * Get event from transaction
 *
 * @param {object} tx Transaction object
 * @param {string} event Event searching for
 * @returns {object} Event stack
 */
export function getEvents(tx, event = null) {
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

    if (Object.keys(stack).length === 0) {
        throw new EmptyStackException('No Events fired');
    }

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
export async function debug(icoTokenInstance, tokenHolder1, tokenHolder2, tokenHolder3, owner, activeTreasurer1) { // eslint-disable-line
    const tokenHolder1Token     = await icoTokenInstance.balanceOf(tokenHolder1);
    const tokenHolder2Token     = await icoTokenInstance.balanceOf(tokenHolder2);
    const tokenHolder3Token     = await icoTokenInstance.balanceOf(tokenHolder3);
    const ownerToken            = await icoTokenInstance.balanceOf(owner);
    const activeTreasurer1Token = await icoTokenInstance.balanceOf(activeTreasurer1);

    const tokenHolder1ClaimableDiv      = await icoTokenInstance.getClaimableDividend(tokenHolder1);
    const tokenHolder2ClaimableDiv      = await icoTokenInstance.getClaimableDividend(tokenHolder2);
    const tokenHolder3ClaimableDiv      = await icoTokenInstance.getClaimableDividend(tokenHolder3);
    const ownerClaimableDiv             = await icoTokenInstance.getClaimableDividend(owner);
    const activeTreasurer1ClaimableDiv  = await icoTokenInstance.getClaimableDividend(activeTreasurer1);

    const fundsHolder1Eth       = web3.eth.getBalance(tokenHolder1);
    const fundsHolder2Eth       = web3.eth.getBalance(tokenHolder2);
    const fundsHolder3Eth       = web3.eth.getBalance(tokenHolder3);
    const ownerEth              = web3.eth.getBalance(owner);
    const activeTreasurer1Eth   = web3.eth.getBalance(activeTreasurer1);
    const contractEth           = web3.eth.getBalance(icoTokenInstance.address);

    console.log('====================================');
    console.log('ACCOUNT | ETH | TOKEN | UNCLAIMED DIVIDEND');
    console.log('------------------------------------');
    console.log('CONTRCT | ' + Math.ceil(contractEth / 1e18) + '    | ');
    console.log('TREASUR | ' + Math.ceil(activeTreasurer1Eth / 1e18) + '   | ' + activeTreasurer1Token.toNumber() + ' | ' + (activeTreasurer1ClaimableDiv / 1e18));
    console.log('OWNER   | ' + Math.ceil(ownerEth / 1e18) + '   | ' + ownerToken.toNumber() + ' | ' + (ownerClaimableDiv / 1e18));
    console.log('USER 1  | ' + Math.ceil(fundsHolder1Eth / 1e18) + '  | ' + tokenHolder1Token.toNumber() + ' | ' + (tokenHolder1ClaimableDiv / 1e18));
    console.log('USER 2  | ' + Math.ceil(fundsHolder2Eth / 1e18) + '  | ' + tokenHolder2Token.toNumber() + ' | ' + (tokenHolder2ClaimableDiv / 1e18));
    console.log('USER 3  | ' + Math.ceil(fundsHolder3Eth / 1e18) + '  | ' + tokenHolder3Token.toNumber() + ' | ' + (tokenHolder3ClaimableDiv / 1e18));
    console.log('====================================');
}
