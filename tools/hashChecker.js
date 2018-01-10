const sha3 = require('web3-utils').sha3;
const fs = require('fs');
const assert = require('assert');

// Valid hashes using Keccak-256

const contracts = {
    Crowdsale     : fs.readFileSync('node_modules/zeppelin-solidity/contracts/crowdsale/Crowdsale.sol'),
    MintableToken : fs.readFileSync('node_modules/zeppelin-solidity/contracts/token/MintableToken.sol'),
    PausableToken : fs.readFileSync('node_modules/zeppelin-solidity/contracts/token/PausableToken.sol'),
    StandardToken : fs.readFileSync('node_modules/zeppelin-solidity/contracts/token/StandardToken.sol'),
    Pausable      : fs.readFileSync('node_modules/zeppelin-solidity/contracts/lifecycle/Pausable.sol'),
    Ownable       : fs.readFileSync('node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol'),
    ERC20         : fs.readFileSync('node_modules/zeppelin-solidity/contracts/token/ERC20.sol'),
    BasicToken    : fs.readFileSync('node_modules/zeppelin-solidity/contracts/token/BasicToken.sol'),
    ERC20Basic    : fs.readFileSync('node_modules/zeppelin-solidity/contracts/token/ERC20Basic.sol'),
    SafeMath      : fs.readFileSync('node_modules/zeppelin-solidity/contracts/math/SafeMath.sol')
};

const hashes = {
    Crowdsale     : '0x28cb2854ac11de737339b5271d7e658df9f526fcf2af8c5f753ce453f291f4fc',
    MintableToken : '0x203a748c796f14ce7651dc1acd10fbd3f4aee071e4050d2e694663731b09d567',
    PausableToken : '0x6b5058991c4b32a84efeedf4c83c5942f01a9c6f6b444187a12d6d18a6a2b7a3',
    StandardToken : '0x084ea849f0633218be73d3eeb6a995027665aa21c3d1b7db7826a0a8794654c8',
    Pausable      : '0x49d41cc2b80f7732cdb504d67cd9a84ebeee38f8ec7204c96c2bded71e295f6a',
    Ownable       : '0x0648cb798def395f9ba28affc7e9757cfa3bdb492925270cc493d6f565275358',
    ERC20         : '0xf1104e30218fcc107e27801b23ab2f48dac4b6e2ac624d572cc803faa3c2eae9',
    BasicToken    : '0x9da9349ec5d64b0c516c8d241895ccd17e0c2e71b2af36690417d9dc7af5359b',
    ERC20Basic    : '0x3f7bc70ddcbefcf5e16c8efea16f70598be7ecaf82531118dc5c3e630f242c17',
    SafeMath      : '0x8be139f1ebd01ca958bd313b7ffb07253964815894104f36ad341e2924893af3'
};

Object.keys(contracts).forEach((key) => {
    try {
        assert.equal(sha3(contracts[key]), hashes[key], 'Hash mismatch: ' + key);
    } catch (error) {
        console.log(error.message + ' - Zeppelin Framework');
        console.log('New Hash: ' + sha3(contracts[key]));
    }
});
