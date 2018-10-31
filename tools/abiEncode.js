/**
 * ABIencode constructor parameters for contract verification
 */

require('babel-register');
require('babel-polyfill');

import cnf from '../ico.cnf.json';
import abi from 'ethereumjs-abi';
import {logger as log} from './logger';

const parameterTypes    = ['uint256', 'uint256', 'uint256', 'address', 'uint256', 'address'];
const parametersRinkeby = [
    cnf.startTime,
    cnf.endTime,
    cnf.rateChfPerEth,
    cnf.network.rinkeby.wallet,
    cnf.confirmationPeriod,
    cnf.network.rinkeby.underwriter
];

const parametersMainNet = [
    cnf.startTime,
    cnf.endTime,
    cnf.rateChfPerEth,
    cnf.network.mainnet.wallet,
    cnf.confirmationPeriod,
    cnf.network.mainnet.underwriter
];

const rinkeby   = abi.rawEncode(parameterTypes, parametersRinkeby);
const mainnet   = abi.rawEncode(parameterTypes, parametersMainNet);

log.info('Rinkeby:');
log.info(rinkeby.toString('hex'));
log.info('===================================');
log.info('MainNet:');
log.info(mainnet.toString('hex'));
