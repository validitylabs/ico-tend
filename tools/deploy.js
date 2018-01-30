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
    const network   = process.env.NODE_ENV;
    const subEsDom  = network === 'rinkeby' ? 'rinkeby.' : '';
    const provider  = `http://${cnf.network[network].host}:${cnf.network[network].port}`;
    const web3      = new Web3(new Web3.providers.HttpProvider(provider));
    const abi       = icoCrowdsaleModule.IcoCrowdsaleAbi;
    const bin       = icoCrowdsaleModule.IcoCrowdsaleByteCode;
    let from        = null;
    let wallet      = null;
    let underwriter = null;
    let startTime   = null;
    let endTime     = null;

    const rateChfPerEth         = cnf.rateChfPerEth;
    const confirmationPeriod    = cnf.confirmationPeriod;

    log.info(`[ Deploying on ${network} ]`);

    from        = cnf.network[network].from;
    wallet      = cnf.network[network].wallet;
    underwriter = cnf.network[network].underwriter;
    startTime   = cnf.startTime;
    endTime     = cnf.endTime;

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
    }).on('error', (error) => {
        log.error('Error occured:');
        log.error(error);
    }).on('transactionHash', (transactionHash) => {
        log.info(`Your contract is being deployed in transaction at http://${subEsDom}etherscan.io/tx/${transactionHash}`);
    }).then((newContractInstance) => {
        log.info(`Smart contract address on Etherscan is https://${subEsDom}etherscan.io/address/${newContractInstance.options.address}`);
    }).catch((error) => {
        log.error('Exception thrown:');
        log.error(error);
    });

    // Debug:
    // icoCrowdsaleInstance.on('receipt', (receipt) => {
    //     log.info('Contract receipt (contains the new contract address)');
    //     log.info(receipt.contractAddress);
    // }).on('confirmation', (confirmationNumber, receipt) => {
    //     log.info(`confirmationNumber: ${confirmationNumber}`);
    //     log.info('receipt:');
    //     log.info(receipt);
    // });

    icoCrowdsaleContract.options.address = icoCrowdsaleInstance.options.address;
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
