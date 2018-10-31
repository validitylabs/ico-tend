import * as fs from 'fs';
import * as path from 'path';
import Web3 from 'web3';
import cnf from '../cnf.json';
import {getContract, mintTokenPresale} from './contractMigrationUtils';

// Configurations
const network = 'mainnet'; // rinkeby or mainnet

if (network.length === 0) {
    throw new Error('The configuration "network" is not set.');
}

const contractAddress = '0x21a3fdBC4E9201e85dDD58B7B320eA5AA581FCd6';
const owner = cnf.networks[network].from;
const presaleFilePath = path.resolve(__dirname, '../presale.csv');

if (contractAddress.length === 0) {
    throw new Error('The configuration "contractAddress" is not set.');
}

if (!fs.existsSync(presaleFilePath)) {
    throw new Error(`The file "${presaleFilePath}" does not exist.`);
}

const web3 = new Web3(new Web3.providers.HttpProvider(`http://${cnf.networks[network].host}:${cnf.networks[network].port}`));
const crowdsaleContract = getContract(web3, contractAddress, owner, cnf.networks[network].gasPrice, cnf.networks[network].gas);

// Deploy all chunks
// mintTokenPresale(crowdsaleContract, owner, presaleFilePath);

// Deploy only the first chunk
mintTokenPresale(crowdsaleContract, owner, presaleFilePath, 0, 1);
