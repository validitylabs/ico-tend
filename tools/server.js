/**
 * RPC server
 * @see https://github.com/trufflesuite/ganache-core/issues/11
 */

import {logger as log} from './logger';
import cnf from '../cnf.json';
import sh from 'shelljs';
import Ganache from 'ganache-core';
import Web3 from 'web3';

// Ensure a fresh DB folder is there
sh.rm('-fr', './db');
sh.mkdir('-p', './db');

const PORT = cnf.networks.develop.port;
const web3 = new Web3(new Web3.providers.HttpProvider('http://' + cnf.networks.develop.host + ':' + PORT));

const config = {
    logger: {
        log: log.trace
    },
    accounts: [
        {
            balance: '0xd3c21bcecceda0000000'
        },
        {
            balance: '0xd3c21bcecceda0000000'
        },
        {
            balance: '0xd3c21bcecceda0000000'
        },
        {
            balance: '0xd3c21bcecceda0000000'
        },
        {
            balance: '0xd3c21bcecceda0000000'
        },
        {
            balance: '0xd3c21bcecceda0000000'
        },
        {
            balance: '0xd3c21bcecceda0000000'
        },
        {
            balance: '0xd3c21bcecceda0000000'
        },
        {
            balance: '0xd3c21bcecceda0000000'
        },
        {
            balance: '0xd3c21bcecceda0000000'
        }
    ],
    mnemonic: 'waste system voyage dentist fine donate purpose truly cactus chest coyote globe',
    port: PORT,
    locked: false,
    gasPrice: cnf.networks.develop.gasPrice,
    gasLimit: cnf.networks.develop.gas,
    network_id: cnf.networks.develop.chainId,
    db_path: './db/'
};

const ganache = Ganache.server(config);

ganache.listen(PORT, async (err) => {
    if (err) {
        log.error(err);
    } else {
        const accounts = await web3.eth.getAccounts();

        log.info('======================================================');
        log.info('[ Ganache Server ]');
        log.info('Host\t: http://' + cnf.networks.develop.host + ':' + PORT);
        log.info('mnemonic\t: ' + config.mnemonic);
        log.info('accounts\t: ');

        accounts.forEach((account) => {
            log.info(account);
        });

        log.info('======================================================');
    }
});
