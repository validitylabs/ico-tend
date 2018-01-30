/**
 * Migration script for the ICO
 */
const cnf           = require('../../ico.cnf.json');
const IcoToken      = artifacts.require('./ico/IcoToken.sol');
const IcoCrowdsale  = artifacts.require('./ico/IcoCrowdsale.sol');

module.exports = function (deployer, network, accounts) {
    if (network === 'rinkeby' || network === 'mainnet') {
        console.log('Truffle migration is for local dev environment only!');
        console.log('For TestNet / MeinNet deployment, please use the provided NPM run scripts');
        process.exit(1);
    }

    const wallet      = accounts[6];
    const underwriter = accounts[9];
    const startTime   = cnf.startTimeTesting;
    const endTime     = cnf.endTimeTesting;

    deployer.deploy(IcoToken);
    deployer.deploy(IcoCrowdsale, startTime, endTime, cnf.rateChfPerEth, wallet, cnf.confirmationPeriod, underwriter);
};
