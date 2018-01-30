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
            network_id: 4447, // eslint-disable-line
            port:       8555,
            gasPrice:   1,
            gas:        100000000
        }
    },
    build_directory:            buildDir,           // eslint-disable-line
    contracts_build_directory:  buildDirContracts,  // eslint-disable-line
    migrations_directory:       migrationsDir,      // eslint-disable-line
    contracts_directory:        srcDir,             // eslint-disable-line
    test_directory:             testDir             // eslint-disable-line
};
