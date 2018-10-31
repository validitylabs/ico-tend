import Web3 from 'web3';
import cnf from '../cnf.json';
import {getContract, transferOwnership} from './contractMigrationUtils';

// Configurations
const network = 'mainnet'; // rinkeby or mainnet

if (network.length === 0) {
    throw new Error('The configuration "network" is not set.');
}

const contractAddress = '0x21a3fdBC4E9201e85dDD58B7B320eA5AA581FCd6';
const owner = cnf.networks[network].from;
const newOwner = '0xBDBC05920B5FbEeABf7DAD1Dc3ACFD9eA9c3B61d';

if (contractAddress.length === 0) {
    throw new Error('The configuration "contractAddress" is not set.');
}

if (newOwner.length === 0) {
    throw new Error('The configuration "newOwner" is not set.');
}

const web3 = new Web3(new Web3.providers.HttpProvider(`http://${cnf.networks[network].host}:${cnf.networks[network].port}`));
const crowdsaleContract = getContract(web3, contractAddress, owner, cnf.networks[network].gasPrice, cnf.networks[network].gas);

transferOwnership(crowdsaleContract, owner, newOwner);
