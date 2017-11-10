/**
 * Test and coverage server
 * @TODO: parametrize type (test / coverage)
 */

require('babel-register');
require('babel-polyfill');
const Ganache = require('ganache-core');

const port      = 9545;
const config    = {
    accounts: [
        {balance: 'F4240'},
        {balance: 'F4240'},
        {balance: 'F4240'},
        {balance: 'F4240'},
        {balance: 'F4240'},
        {balance: 'F4240'},
        {balance: 'F4240'},
        {balance: 'F4240'},
        {balance: 'F4240'},
        {balance: 'F4240'}
    ],
    mnemonic: 'waste system voyage dentist fine donate purpose truly cactus chest coyote globe',
    port: 9545,
    total_accounts: 10,
    network_id: 4447,
    locked: false,
    db_path: './db/'
};

const server = Ganache.server(config);

server.listen(port, (err, blockchain) => {
    if (err) {
        console.log(err);
    } else {
        console.log(blockchain);

        const exec = require('child_process').exec;

        exec('truffle test --network _development', (error, stdout, stderr) => {
            console.log('stdout: ', stdout);
            console.log('stderr: ', stderr);

            if (error !== null) {
                console.log('exec error: ', error);
            }
        });

        // process.exit();
    }
});
