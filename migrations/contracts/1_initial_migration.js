const Migrations    = artifacts.require('./Migrations.sol');
const cnf           = require('../../ico.cnf.json');

module.exports = function (deployer) {
    if (process.env.NODE_ENV === 'ropsten') {
        deployer.deploy(Migrations, {
            from:       cnf.network.ropsten.from,
            gas:        cnf.network.ropsten.gas, // web3.eth.getBlock('pending').gasLimit - 500
            gasPrice:   cnf.network.ropsten.gasPrice
        });
    } else {
        deployer.deploy(Migrations);
    }
};
