/**
 * Deployment script for Rinkeby and MainNet
 */

require('babel-register');
require('babel-polyfill');

import {logger as log} from './logger';
import cnf from '../ico.cnf.json';
import Web3 from 'web3';
import * as icoCrowdsaleModule from '../build/bundle/IcoCrowdsale.sol.js';

/**
 * Deployment procedure
 * @returns {void}
 */
async function deploy() {
    const network               = process.env.NODE_ENV;
    const subEsDom              = network === 'rinkeby' ? 'rinkeby.' : '';
    const provider              = `http://${cnf.network[network].host}:${cnf.network[network].port}`;
    const web3                  = new Web3(new Web3.providers.HttpProvider(provider));
    const abi                   = icoCrowdsaleModule.IcoCrowdsaleAbi;
    const bin                   = icoCrowdsaleModule.IcoCrowdsaleByteCode;
    const from                  = cnf.network[network].from;
    const wallet                = cnf.network[network].wallet;
    const underwriter           = cnf.network[network].underwriter;
    const startTime             = cnf.startTime;
    const endTime               = cnf.endTime;
    const rateChfPerEth         = cnf.rateChfPerEth;
    const confirmationPeriod    = cnf.confirmationPeriod;

    log.info(`[ ${network} ]`);

    const icoCrowdsaleContract  = new web3.eth.Contract(
        abi,
        null,
        {
            data:       bin,
            from:       from,
            gas:        cnf.network[network].gas,
            gasPrice:   cnf.network[network].gasPrice
        }
    );

    const icoCrowdsaleInstance = await icoCrowdsaleContract.deploy({
        data: bin,
        arguments: [
            startTime,
            endTime,
            rateChfPerEth,
            wallet,
            confirmationPeriod,
            underwriter
        ]
    }).send({
        gas:        cnf.network[network].gas,
        gasPrice:   cnf.network[network].gasPrice,
        from: from
    }).catch((error) => {
        log.error('Exception thrown:');
        log.error(error);
    });

    icoCrowdsaleContract.options.address = icoCrowdsaleInstance.options.address;
    log.info(`Finished deployment on ${subEsDom} :)`);
    log.info(`IcoCrowdsale: https://${subEsDom}etherscan.io/address/${icoCrowdsaleContract.options.address}`);
}

/**
 * Sanity check and start deployment
 */
(async () => {
    if (process.env.NODE_ENV !== 'rinkeby' && process.env.NODE_ENV !== 'mainnet') {
        log.error('Network for deployment not found');
        process.exit(1);
    } else {
        deploy();
    }
})();
