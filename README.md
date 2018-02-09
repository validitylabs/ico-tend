# Snowflake Solidity
__Beware of the failing tests!__
This behaviour is equal to the tend and medical ico tests.

## TODO
@TODO: setup solcpiler (from ico-tend)

__ATTENTION!!! audit the zeppelin code to verify the SHA hashes__

@see https://github.com/duaraghav8/Solium
@see https://medium.com/giveth/the-minime-token-open-sourced-by-giveth-2710c0210787

@see https://github.com/trufflesuite/truffle/releases
@see https://github.com/trufflesuite/truffle-contract
@see http://web3js.readthedocs.io/en/1.0/
@see https://github.com/trufflesuite/ganache-core

Modum Token (with Dividend (called Airdrop)):
@see https://github.com/modum-io/tokenapp-smartcontract/blob/master/contracts/ModumToken.sol

https://epicenter.tv/episode/200/

### Features
@TODO: Implement `voteProposal` -> (proposal + voting)
@TODO: Implement `votePayout` -> voting for payout of ICO (limit ETH payout for proposal)
@TODO: Check geth run script in package.json (if it's running, update readme.md with instructions)
@TODO replace usage of `colors` by `chalk` and remove NPM package `colors` from package.json

```
web3.version.getNetwork((err, netId) => {
    switch (netId) {
        case "1":
            console.log('This is mainnet')
            break
        case "2":
            console.log('This is the deprecated Morden test network.')
            break
        case "3":
            console.log('This is the ropsten test network.')
            break
        case "1337":
            console.log('This is the local test network.')
            break
        default:
            console.log('This is an unknown network.')
    }
});
```

## Requirements
The server side scripts requires NodeJS 8 to work properly.
Go to [NVM](https://github.com/creationix/nvm) and follow the installation description.
By running `source ./tools/initShell.sh`, the correct NodeJs version will be activated for the current shell.

NVM supports both Linux and OS X, but that’s not to say that Windows users have to miss out. There is a second project named [nvm-windows](https://github.com/coreybutler/nvm-windows) which offers Windows users the possibility of easily managing Node environments.

__nvmrc support for windows users is not given, please make sure you are using the right Node version (as defined in .nvmrc) for this project!__

Yarn is required to be installed globally to minimize the risk of dependency issues.
Go to [Yarn](https://yarnpkg.com/en/docs/install) and choose the right installer for your system.

For the Rinkeby and MainNet deployment, you need Geth on your machine.
Follow the [installation instructions](https://github.com/ethereum/go-ethereum/wiki/Building-Ethereum) for your OS.

Depending on your system the following components might be already available or have to be provided manually:
* [Python](https://www.python.org/downloads/windows/) 2.7 Version only! Windows users should put python into the PATH by cheking the mark in installation process. The windows build tools contain python, so you don't have to install this manually.
* GIT, should already installed on *nix systems. Windows users have to install [GIT](http://git-scm.com/download/win) manually.
* On Windows systems, PowerShell is mandatory
* On Windows systems, windows build tools are required (already installed via package.json)
* make (on Ubuntu this is part of the commonly installed `sudo apt-get install build-essential`)
* On OSX the build tools included in XCode are required

## General
Before running the provided scripts, you have to initialize your current terminal via `source ./tools/initShell.sh` for every terminal in use. This will add the current directory to the system PATH variables and must be repeated for time you start a new terminal window from project base directory. Windows users with installed PoserShell should use the script `. .\tools\initShell.ps1` instead.
```
# *nix
cd <project base directory>
source ./tools/initShell.sh

# Win
cd <project base directory>
. .\tools\initShell.ps1
```

__Every command must be executed from within the projects base directory!__

## Setup
Open your terminal and change into your project base directory. From here, install all needed dependencies.
```
yarn install
```
This will install all required dependecies in the directory _node_modules_.

## Compile, migrate, test and coverage
To compile, deploy and test the smart contracts, go into the projects root directory and use the task runner accordingly.
```
# Compile contract
yarn compile

# Migrate contract
yarn migrate

# Test the contract
yarn test

# Run coverage tests
yarn coverage
```

## Infura Testnet Deployment - Ropsten, Rinkeby, & Kovan
create a `.secrets.json` file in the config directory of this project and insert the following with your Infura API key and mnemonic. Double check and make sure that file name is included in the `.gitignore` file list.
__Never commit and push your mnemonics!__
```
{
    "rinkeby": {
        "host": "https://rinkeby.infura.io/<APIKEY>",
        "mnemonic": "<MNEMONIC>"
    }
}
```

## Rinkeby testnet deployment
Start local Rinkeby test node in a separate terminal window and wait for the sync is finished.
```
yarn geth-rinkeby
```

Now you can connect to your local Rinkeby Geth console.
```
geth attach ipc://<PATH>/<TO>/Library/Ethereum/rinkeby/geth.ipc

# e.g.
# geth attach ipc://Users/patrice/Library/Ethereum/rinkeby/geth.ipc
```

Upon setup the node does not contain any private keys and associated accounts. Create an account in the web3 Geth console.
```
web3.personal.newAccount()
```
Press [Enter] twice to skip the password (or set one but then later it has to be provided for unlocking the account).

Read the address and send some Rinkeby Ether to pay for deployment and management transaction fees.
```
web3.eth.accounts
```
You can [obtain Rinkeby testnet Ether](https://www.rinkeby.io/#faucet) from the faucet by pasting your address in social media and pasting the link.

Connect to your rinkeby Geth console and unlock the account for deployment (2700 seconds = 45 minutes).
```
> personal.unlockAccount(web3.eth.accounts[0], "", 2700)
```

Ensure, all config files below `./config/` folder is setup properly. The `from` address will be used for the deployment, usually accounts[0].

After exiting the console by `<STRG> + <D>`, simply run `yarn migrate-rinkeby`.
This may take several minutes to finish.

You can monitor the deployment live via [Rinkeby](https://rinkeby.etherscan.io/address/<YOUR_RINKEBY_ADDRESS>)

After all, your smart contract can be found on etherscan:
https://rinkeby.etherscan.io/address/<REAL_CONTRACT_ADDRESS_HERE>

## MainNet deployment
__This is the production deployment, so please doublecheck all properties in the config files below `config` folder!__

For the MainNet deployment, you need a Geth installation on your machine.
Follow the [installation instructions](https://github.com/ethereum/go-ethereum/wiki/Building-Ethereum) for your OS.

Start local MainNet Ethereum node in a separate terminal window and wait for the sync is finished.
```
geth --syncmode "fast" --rpc
```

Now you can connect to your local MainNet Geth console.
```
geth attach ipc://<PATH>/<TO>/Library/Ethereum/geth.ipc

# e.g.
# geth attach ipc://Users/patrice/Library/Ethereum/geth.ipc
```

While syncing the blockchain, you can monitor the progress by typing `web3.eth.syncing`.
This shows you the highest available block and the current block you are on. If syncing is done, false will be returned. In this case, you can `web3.eth.blockNumber` and compare with the latest BlockNumber on Etherscan.

Upon setup the node does not contain any private keys and associated accounts. Create an account in the web3 Geth console.
```
web3.personal.newAccount("<YOUR_SECURE_PASSWORD>")
```
Enter <YOUR_SECURE_PASSWORD> and Press [Enter] to finish the account creation.

Read the address and send some real Ether to pay for deployment and management transaction fees.
```
web3.eth.accounts
```

Connect to your MainNet Geth console and unlock the account for deployment (240 seconds = 4 minutes).
```
personal.unlockAccount(web3.eth.accounts[0], "<YOUR_SECURE_PASSWORD>", 240)
```

Ensure, all config files below `./config/` folder is setup properly. The `from` address will be used for the deployment, usually accounts[0].

After exiting the console by `<STRG> + <D>`, simply run `yarn migrate-mainnet`.
This may take several minutes to finish.

You can monitor the deployment live via [Etherscan](https://etherscan.io/address/<YOUR_RINKEBY_ADDRESS>)

After all, your smart contract can be found on etherscan:
https://etherscan.io/address/<REAL_CONTRACT_ADDRESS_HERE>

### Contract Verification
The final step for the Rinkeby / MainNet deployment is the contract verificationSmart contract verification.

This can be dome on [Etherscan](https://etherscan.io/address/<REAL_ADDRESS_HERE>) or [Rinkeby Etherscan](https://rinkeby.etherscan.io/address/<REAL_ADDRESS_HERE>).
- Click on the `Contract Creation` link in the `to` column
- Click on the `Contract Code` link

Fill in the following data.
```
Contract Address:       <CONTRACT_ADDRESS>
Contract Name:          <CONTRACT_NAME>
Compiler:               v0.4.19+commit.c4cbbb05
Optimization:           YES
Solidity Contract Code: <Copy & Paste from ./build/bundle/IcoCrowdsale_all.sol>
Constructor Arguments:  <ABI from deployment output>
```
Visit [Solc version number](https://github.com/ethereum/solc-bin/tree/gh-pages/bin) page for determining the correct version number for your project.

- Confirm you are not a robot
- Hit `verify and publish` button

Now your smart contract is verified.
