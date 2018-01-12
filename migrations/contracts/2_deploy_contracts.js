/**
 * Migration script for the ICO
 *
 * @see https://github.com/trufflesuite/truffle/issues/501#issuecomment-332589663
 */
const BigNumber     = require('bignumber.js');
const cnf           = require('../../ico.cnf.json');
const IcoToken      = artifacts.require('./ico/IcoToken.sol');
const IcoCrowdsale  = artifacts.require('./ico/IcoCrowdsale.sol');

module.exports = function (deployer, network, accounts) { // eslint-disable-line
    const wallet    = accounts[6];
    const teamWallet = accounts[7];
    const companyWallet = accounts[8];
    const bankFrick = accounts[9];

    deployer.deploy(IcoToken);
    deployer.deploy(IcoCrowdsale, cnf.startTime, cnf.endTime, cnf.rateTokenPerChf, cnf.rateWeiPerChf, wallet, cnf.confirmationPeriod, teamWallet, companyWallet, bankFrick);
};
