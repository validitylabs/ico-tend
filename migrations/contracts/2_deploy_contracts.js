/**
 * Migration script for the ICO
 *
 * @see https://github.com/trufflesuite/truffle/issues/501#issuecomment-332589663
 */

const cnf           = require('../../ico.cnf.json');
const IcoToken      = artifacts.require('./ico/IcoToken.sol');
const IcoCrowdsale  = artifacts.require('./ico/IcoCrowdsale.sol');

module.exports = function (deployer, network, accounts) { // eslint-disable-line
    deployer.deploy(IcoToken);

    const wallet = accounts[6];

    deployer.deploy(IcoCrowdsale, cnf.startTime, cnf.endTime, cnf.rateEthPerToken, wallet);
};
