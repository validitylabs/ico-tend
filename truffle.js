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
        coverage: {
            host:       'localhost',
            network_id: 4447,
            port:       8555,
            gasPrice:   1,
            gas:        100000000
        },
        ropsten: {
            host:       cnf.network.ropsten.host,
            from:       cnf.network.ropsten.from,
            network_id: 3,
            port:       8545,
            gas:        cnf.network.ropsten.gas,        // 0x3d0900
            gasPrice:   cnf.network.ropsten.gasPrice    // 0xee6b2800
        }
    },
    build_directory:            buildDir,
    contracts_build_directory:  buildDirContracts,
    migrations_directory:       migrationsDir,
    contracts_directory:        srcDir,
    test_directory:             testDir
};
