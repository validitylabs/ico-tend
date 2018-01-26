/**
 * Truffle configuration
 */

require('babel-register');
require('babel-polyfill');

const cnf   = require('./ico.cnf.json');
const path  = require('path');

const basePath          = process.cwd();
const buildDir          = path.join(basePath, 'build');
const buildDirContracts = path.join(basePath, 'build/contracts');
const srcDir            = path.join(basePath, 'src/contracts');
const testDir           = path.join(basePath, 'test/contracts');
const migrationsDir     = path.join(basePath, 'migrations/contracts');

module.exports = {
    mocha: {
        useColors: true
    },
    solc: {
        optimizer: {
            enabled:    true,
            runs:       200
        }
    },
    networks: {
        _development: {
            host: 'localhost',
            port: 9545,
            network_id: 4447,
            gas: cnf.network.rinkeby.gas
        },
        coverage: {
            host:       'localhost',
            network_id: 4447,
            port:       8555,
            gasPrice:   1,
            gas:        100000000
        },
        rinkeby: {
            host:       cnf.network.rinkeby.host,
            from:       cnf.network.rinkeby.from,
            network_id: 4,
            port:       8545,
            gas:        cnf.network.rinkeby.gas
        },
        mainnet: {
            host:       cnf.network.mainnet.host,
            from:       cnf.network.mainnet.from,
            network_id: 1,
            port:       8545,
            gas:        cnf.network.mainnet.gas
        }
    },
    build_directory:            buildDir,
    contracts_build_directory:  buildDirContracts,
    migrations_directory:       migrationsDir,
    contracts_directory:        srcDir,
    test_directory:             testDir
};
