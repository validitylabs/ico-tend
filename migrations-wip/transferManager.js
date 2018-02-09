import Web3 from 'web3';
import cnf from '../cnf.json';
import {getContract, setManager} from './contractMigrationUtils';

// Configurations
const network = ''; // rinkeby or mainnet

if (network.length === 0) {
    throw new Error('The configuration "network" is not set.');
}

const contractAddress = '';
const owner = cnf.networks[network].from;
const managerToDisable = '';
const managerToEnable = '';

if (contractAddress.length === 0) {
    throw new Error('The configuration "contractAddress" is not set.');
}

if (managerToDisable.length === 0) {
    throw new Error('The configuration "managerToDisable" is not set.');
}

if (managerToEnable.length === 0) {
    throw new Error('The configuration "managerToEnable" is not set.');
}

const web3 = new Web3(new Web3.providers.HttpProvider(`http://${cnf.networks[network].host}:${cnf.networks[network].port}`));
const crowdsaleContract = getContract(web3, contractAddress, owner, cnf.networks[network].gasPrice, cnf.networks[network].gas);

// Enable managerToEnable
setManager(crowdsaleContract, managerToDisable, managerToEnable, true);
// Disable managerToDisable
setManager(crowdsaleContract, managerToDisable, managerToDisable, false);
