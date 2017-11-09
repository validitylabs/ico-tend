/**
 * @see https://github.com/trufflesuite/truffle/issues/501#issuecomment-332589663
 */

// const DividendToken = artifacts.require('./ico/DividendToken.sol');
const IcoToken      = artifacts.require('./ico/IcoToken.sol');
const IcoCrowdsale  = artifacts.require('./ico/IcoCrowdsale.sol');

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
    let startTime       = 1513382400; // 12/16/2017 @ 12:00am (UTC)
    let endTime         = 1514073600; // 12/24/2017 @ 12:00am (UTC)    
    let rateEthPerToken = 1;
    let wallet          = accounts[6];

    deployer.deploy(IcoCrowdsale, startTime, endTime, rateEthPerToken, wallet);
};
