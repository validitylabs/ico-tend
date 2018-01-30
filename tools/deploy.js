/**
 * Deployment script for Rinkeby and MainNet
 */

require('babel-register');
require('babel-polyfill');

import {logger as log} from './logger';
import cnf from '../ico.cnf.json';
import Web3 from 'web3';
import * as icoCrowdsaleModule from '../build/bundle/IcoCrowdsale.sol.js';

const provider      = `http://${cnf.network[process.env.NODE_ENV].host}:${cnf.network[process.env.NODE_ENV].port}`;
const web3          = new Web3(new Web3.providers.HttpProvider(provider));
const abi           = icoCrowdsaleModule.IcoCrowdsaleAbi;
const bin           = icoCrowdsaleModule.IcoCrowdsaleByteCode;

async function deploy() {
    let from        = null;
    let wallet      = null;
    let underwriter = null;
    let startTime   = null;
    let endTime     = null;

    const rateChfPerEth         = cnf.rateChfPerEth;
    const confirmationPeriod    = cnf.confirmationPeriod;

    log.info(`[ Deploying on ${process.env.NODE_ENV} ]`);

    switch (process.env.NODE_ENV) {
        case 'rinkeby':
            from        = cnf.network.rinkeby.from;
            wallet      = cnf.network.rinkeby.wallet;
            underwriter = cnf.network.rinkeby.underwriter;
            startTime   = cnf.startTime;
            endTime     = cnf.endTime;

            const icoCrowdsaleContract  = new web3.eth.Contract(
                abi,
                null,
                {
                    data:       bin,
                    from:       from,
                    gas:        cnf.network.rinkeby.gas,
                    gasPrice:   cnf.network.rinkeby.gasPrice
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
                gas:        cnf.network.rinkeby.gas,
                gasPrice:   cnf.network.rinkeby.gasPrice,
                from: from
            }).on('error', (error) => {
                log.error('Error occured:');
                log.error(error);
            }).on('transactionHash', (transactionHash) => {
                log.info(`Your contract is being deployed in transaction at http://rinkeby.etherscan.io/tx/${transactionHash}`);
            }).then((newContractInstance) => {
                log.info(`Smart contract address on Etherscan is https://rinkeby.etherscan.io/address/${newContractInstance.options.address}`);
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
            break;
        case 'mainnet':
            log.error('Not implemented yet');
            break;
        default:
            log.info('[ No Network selected, giving up. ]');
    }
}

(async () => {
    deploy();
})();
