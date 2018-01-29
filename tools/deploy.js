/**
 * Deployment script for Rinkeby and MainNet
 */

require('babel-register');
require('babel-polyfill');

import {logger as log} from './logger';
import cnf from '../ico.cnf.json';
import Web3 from 'web3';
import * as icoCrowdsaleModule from '../build/mew/IcoCrowdsale.sol.js';

const provider      = `http://${cnf.network[process.env.NODE_ENV].host}:${cnf.network[process.env.NODE_ENV].port}`;
const web3          = new Web3(new Web3.providers.HttpProvider(provider));
const abi           = icoCrowdsaleModule.IcoCrowdsaleAbi;
const bin           = icoCrowdsaleModule.IcoCrowdsaleByteCode;

async function getAccounts() {
    const ret = await web3.eth.getAccounts();
    return ret;
}

async function deploy() {
    const accounts  = await getAccounts();
    let wallet      = null;
    let underwriter = null;
    let startTime   = null;
    let endTime     = null;

    const rateChfPerEth         = cnf.rateChfPerEth;
    const confirmationPeriod    = cnf.confirmationPeriod;

    switch (process.env.NODE_ENV) {
        case 'rinkeby':
            log.info('[ Deploying on Rinkeby ]');

            wallet      = cnf.network.rinkeby.wallet;
            underwriter = cnf.network.rinkeby.underwriter;
            startTime   = cnf.startTime;
            endTime     = cnf.endTime;

            const icoCrowdsaleContract  = new web3.eth.Contract(
                abi,
                null,
                {
                    data:       bin,
                    from:       accounts[0],
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
                from: accounts[0]
            }, (error, transactionHash) => {
                if (error) {
                    log.error(error);
                }
                // else {
                //     log.info(`Transaction hash: ${transactionHash}`);
                // }
            }).on('error', (error) => {
                log.error('Error occured');
                log.error(error);
            }).on('transactionHash', (transactionHash) => {
                log.info(`Transaction hash: ${transactionHash}`);
            }).on('receipt', (receipt) => {
                log.info('Contract receipt (contains the new contract address)');
                log.info(receipt.contractAddress);
            })
            // .on('confirmation', (confirmationNumber, receipt) => {
            //     log.info(`confirmationNumber: ${confirmationNumber}`);
            //     log.info('receipt:');
            //     log.info(receipt);
            // })
            .then((newContractInstance) => {
                log.info(`Address of new instance: ${newContractInstance.options.address}`);
            }).catch((error) => {
                log.error('Exception thrown');
                log.error(error);
            });

            icoCrowdsaleContract.options.address = icoCrowdsaleInstance.options.address;

            log.info(`icoCrowdsaleContractAddress: ${icoCrowdsaleContract.options.address}`);
            log.info(`Your contract is being deployed in transaction at http://rinkeby.etherscan.io/tx/${icoCrowdsale.transactionHash}`);
            break;
        case 'mainnet':
            log.info('[ Deploying on MainNet ]');
            log.error('Not implemented yet');
            break;
        default:
            log.info('[ No Network selected, giving up. ]');
    }
}

(async () => {
    deploy();
})();
