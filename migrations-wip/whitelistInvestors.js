import * as fs from 'fs';
import * as path from 'path';
import Web3 from 'web3';
import cnf from '../cnf.json';
import {getContract, whiteListInvestors} from './contractMigrationUtils';

// Configurations
const network = ''; // rinkeby or mainnet

if (network.length === 0) {
    throw new Error('The configuration "network" is not set.');
}

const contractAddress = '';
const owner = cnf.networks[network].from;
const investorsFilePath = path.resolve(__dirname, '../investors.csv');

if (contractAddress.length === 0) {
    throw new Error('The configuration "contractAddress" is not set.');
}

if (!fs.existsSync(investorsFilePath)) {
    throw new Error(`The file "${investorsFilePath}" does not exist.`);
}

const web3 = new Web3(new Web3.providers.HttpProvider(`http://${cnf.networks[network].host}:${cnf.networks[network].port}`));
const crowdsaleContract = getContract(web3, contractAddress, owner, cnf.networks[network].gasPrice, cnf.networks[network].gas);

whiteListInvestors(crowdsaleContract, owner, investorsFilePath);
