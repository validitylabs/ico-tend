/**
 * Migration script for the ICO
 *
 * @see https://github.com/trufflesuite/truffle/issues/501#issuecomment-332589663
 */

const IcoToken      = artifacts.require('./ico/IcoToken.sol');
const IcoCrowdsale  = artifacts.require('./ico/IcoCrowdsale.sol');

module.exports = function (deployer, network, accounts) { // eslint-disable-line
    deployer.deploy(IcoToken);

    const startTime         = 1513382400; // 12/16/2017 @ 12:00am (UTC)
    const endTime           = 1514073600; // 12/24/2017 @ 12:00am (UTC)
    const rateEthPerToken   = 1;
    const wallet            = accounts[6];

    deployer.deploy(IcoCrowdsale, startTime, endTime, rateEthPerToken, wallet);
};
