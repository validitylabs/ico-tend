/**
 * @see https://github.com/trufflesuite/truffle/issues/501#issuecomment-332589663
 */

// const DividendToken = artifacts.require('./ico/DividendToken.sol');
const IcoToken      = artifacts.require('./ico/IcoToken.sol');
// const IcoCrowdsale  = artifacts.require('./ico/IcoCrowdsale.sol');

module.exports = function (deployer, network, accounts) { // eslint-disable-line
    // let owner;

    // switch (network) {
    //     case 'development':
    //     default:
    //         owner = accounts[0];
    //         break;
    // }
    // deployer.deploy(DividendToken, owner);
    deployer.deploy(IcoToken);
    // deployer.deploy(IcoCrowdsale);
};
