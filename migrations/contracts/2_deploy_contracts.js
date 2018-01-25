/**
 * Migration script for the ICO
 */

const cnf           = require('../../ico.cnf.json');
const IcoToken      = artifacts.require('./ico/IcoToken.sol');
const IcoCrowdsale  = artifacts.require('./ico/IcoCrowdsale.sol');

module.exports = function (deployer, network, accounts) { // eslint-disable-line
    let wallet      = accounts[6];
    let underwriter = accounts[9];
    let startTime   = cnf.startTimeTesting;
    let endTime     = cnf.endTimeTesting;

    if (process.env.NODE_ENV === 'ropsten') {
        wallet      = cnf.network.ropsten.wallet;
        underwriter = cnf.network.ropsten.underwriter;
        startTime   = cnf.startTime;
        endTime     = cnf.endTime;

        deployer.deploy(IcoToken, {
            from:       cnf.network.ropsten.from,
            gas:        cnf.network.ropsten.gas
        });

        deployer.deploy(IcoCrowdsale, startTime, endTime, cnf.rateChfPerEth, wallet, cnf.confirmationPeriod, underwriter, {
            from:       cnf.network.ropsten.from,
            gas:        cnf.network.ropsten.gas
        });
    } else {
        deployer.deploy(IcoToken);
        deployer.deploy(IcoCrowdsale, startTime, endTime, cnf.rateChfPerEth, wallet, cnf.confirmationPeriod, underwriter);
    }
};
