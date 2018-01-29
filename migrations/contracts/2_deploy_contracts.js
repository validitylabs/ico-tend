/**
 * Migration script for the ICO
 */
const cnf           = require('../../ico.cnf.json');
const IcoToken      = artifacts.require('./ico/IcoToken.sol');
const IcoCrowdsale  = artifacts.require('./ico/IcoCrowdsale.sol');

module.exports = function (deployer, network, accounts) { // eslint-disable-line
    let wallet      = null;
    let underwriter = null;
    let startTime   = null;
    let endTime     = null;

    if (process.env.NODE_ENV === 'rinkeby') {
        wallet      = cnf.network.rinkeby.wallet;
        underwriter = cnf.network.rinkeby.underwriter;
        startTime   = cnf.startTime;
        endTime     = cnf.endTime;

        deployer.deploy(IcoCrowdsale, startTime, endTime, cnf.rateChfPerEth, wallet, cnf.confirmationPeriod, underwriter, {
            from:       cnf.network.rinkeby.from,
            gas:        cnf.network.rinkeby.gas,
            gasPrice:   cnf.network.rinkeby.gasPrice
        });
    } else if (process.env.NODE_ENV === 'mainnet') {
        wallet      = cnf.network.mainnet.wallet;
        underwriter = cnf.network.mainnet.underwriter;
        startTime   = cnf.startTime;
        endTime     = cnf.endTime;

        deployer.deploy(IcoCrowdsale, startTime, endTime, cnf.rateChfPerEth, wallet, cnf.confirmationPeriod, underwriter, {
            from:       cnf.network.mainnet.from,
            gas:        cnf.network.mainnet.gas,
            gasPrice:   cnf.network.mainnet.gasPrice
        });
    } else {
        wallet      = accounts[6];
        underwriter = accounts[9];
        startTime   = cnf.startTimeTesting;
        endTime     = cnf.endTimeTesting;

        deployer.deploy(IcoToken);
        deployer.deploy(IcoCrowdsale, startTime, endTime, cnf.rateChfPerEth, wallet, cnf.confirmationPeriod, underwriter);
    }
};
