# ICO for TEND

## Crowdsale Features:
* 13 million total token cap
    * 9.5 million presale & crowdsale cap
    * 1.5 million ICO enablers cap - not vested
    * 2 million development team cap - vested
* Vested tokens
    * vesting period starts at the time that the admin allocates the tokens
    * each beneficiary has their own vesting contract that locks up their tokens until they can be released by beneficiary themselves
    * 1/4 available after 1 year, nothing before (cliff)
    * remainder can be released continuously until all tokens are released after a total of 4 years (3 years past cliff)
    * non-revocable, can be released by respective owner from their vesting contract (one contract per owner)
* owner can allot tokens for presale investors manually, this still requires confirmation and settlement
* allow token distribution to different address than sending Ether address via `buyTokens` - requires confirmation and settlement
* Discounts:
    * 1st 3 million    -  20% discount -  1 token = 8 CHF
    * 2nd 3 million    -  10% discount -  1 token = 9 CHF
    * last 3.5 million -  0% discount  -  1 token = 10 CHF
* underwriter has to make tokens transferrable by calling `finalize`, if they do not, tokens will remain paused
* owner of
* mintTeamTokens(uint256 amount) - mints up to 1.5 million tokens that are vested over 4 years
* mintCompanyTokens - mints 2 million tokens that are vested over 4 years
* owner is transferrable

## Token Features:
* ERC20-compatible
* pausable
* paused until un-paused by `finalize` in crowdsale contract
* featuring dividend:
    * dividend coupled to token, unclaimed dividend transferred along when using token `transfer` or `transferFrom` functions
    * dividend can be paid in once every 350 days by treasurer account
    * dividend can be claimed up to 330 days after receiving the payment
    * unclaimed dividend can be reclaimed by owner 330 days until last payment and until next payment is coming in
* treasurer accounts set by owner
* owner is transferrable

## Requirements
The server side scripts requires NodeJS 8.
Go to [NVM](https://github.com/creationix/nvm) and follow the installation description.
By running `source ./tools/initShell.sh`, the correct NodeJs version will be activated for the current shell.

Yarn is required to be installed globally to minimize the risk of dependency issues.
Go to [Yarn](https://yarnpkg.com/en/docs/install) and choose the right installer for your system.

Depending on your system the following components might be already available or have to be provided manually:
* Python 2.7
* make (on Ubuntu this is part of the commonly installed `sudo apt-get install build-essential`)
* On OSX the build tools included in XCode are required

## General
Before running the provided scripts, you have to initialize your current terminal via `source ./tools/initShell.sh` for every terminal in use. This will add the current directory to the system PATH variables and must be repeated for time you start a new terminal window from project base directory.
```
cd <project base directory>
source ./tools/initShell.sh
```

__Every command must be executed from within the projects base directory!__

## Setup
Open your terminal and change into your project base directory. From here, install all needed dependencies.
```
cd <project base directory>
source ./tools/initShell.sh
yarn install
```
This will install all required dependecies in the directory _node_modules_.

## NVM
You can load the configured lts/carbon NodeJS version (8.x LTS) for this project by running `nvm use` in project root directory.

## Compile, migrate and run unit tests
To deploy the ICO smart contracts, go into the projects root directory, and change into the truffle development console.
```
cd <project base directory>
source ./tools/initShell.sh
yarn run dev
```

Now you can compile, migrate and run tests.
```
# Compile contract
compile

# Migrate contract
migrate

# Test the contract
test
```
To leave the development console, simply press <CTRL + D>.

__The development console will automatically start it's own TestRPC server for you!__

__Because the test consumes a lot of ETH, please restart the development console between each test run!__

## Run the coverage test
To run the coverage tests, go into the projects root directory and run the coverage test.
```
cd <project base directory>
source ./tools/initShell.sh
yarn run coverage
```
__The coverage test will automatically start it's own TestRPC server for you!__

## Rinkeby deployment
For the Rinkeby deployment, you need a Geth installation on your machine.
Follow the [installation instructions](https://github.com/ethereum/go-ethereum/wiki/Building-Ethereum) for your OS.

Start local Rinkeby test node in a separate terminal window and wait for the sync is finished.
```
geth --syncmode "fast" --rinkeby --rpc --rpcapi "eth,net,web3,personal"
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

Change the `from` (deployer), `wallet` and `underwriter` accounts in ico.cnf.json:
```
"from":         "0x0fadbcc6baf38842493ea527759ce7ce1644d0cc",
"wallet":       "0x4e6fF5fCe21DCF91ad966DDC3aE9D8A1843Ce42A",
"underwriter":  "0xF49aC64dbFfD7AE4342ca7A0C5DBbcb95f7513e7",
```
`from` has to be the address that is used for deployment (`web3.eth.accounts[0]`), `wallet` and `underwriter` can be some other addresses (e.g. from MetaMask).

After exiting the console by `<STRG> + <D>`, simply run `yarn migrate-rinkeby`.
This may take several minutes to finish.

https://rinkeby.etherscan.io/address/0x0fadbcc6baf38842493ea527759ce7ce1644d0cc

## MainNet deployment
__This is the production deployment, so please doublecheck all properties in ico.cnf.json!__
- update ico.cnf.json with latest startTime, endTime, cap, confirmation period, rateChfPerEth

For the MainNet deployment, you need a Geth installation on your machine.
Follow the [installation instructions](https://github.com/ethereum/go-ethereum/wiki/Building-Ethereum) for your OS.

Start local MainNet Ethereum node in a separate terminal window and wait for the sync is finished.
```
geth --syncmode "fast" --rpc --rpcapi "eth,net,web3,personal"
```

Now you can connect to your local MainNet Geth console.
```
geth attach ipc://<PATH>/<TO>/Library/Ethereum/geth.ipc

# e.g.
# geth attach ipc://Users/patrice/Library/Ethereum/geth.ipc
```

While syncing the blockchain, you can monitor the progress by typing `web3.eth.syncing`.
This shows you the highest available block and the current block you are on.

Upon setup the node does not contain any private keys and associated accounts. Create an account in the web3 Geth console.
```
web3.personal.newAccount()
```
Press [Enter] twice to skip the password (or set one but then later it has to be provided for unlocking the account).

Read the address and send some real Ether to pay for deployment and management transaction fees.
```
web3.eth.accounts
```

Connect to your MainNet Geth console and unlock the account for deployment (2700 seconds = 45 minutes).
```
> personal.unlockAccount(web3.eth.accounts[0], "", 2700)
```

Change the `from` (deployer), `wallet` and `underwriter` accounts in ico.cnf.json:
```
"from":         "<REAL_ADDRESS_HERE>",
"wallet":       "<REAL_ADDRESS_HERE>",
"underwriter":  "<REAL_ADDRESS_HERE>",
```
`from` has to be the address that is used for deployment (`web3.eth.accounts[0]`), `wallet` and `underwriter` can be some other addresses (e.g. from MetaMask).

After exiting the console by `<STRG> + <D>`, simply run `yarn migrate-mainnet`.
This may take several minutes to finish.

Now, your smart contract can be found on etherscan:
https://etherscan.io/address/<REAL_ADDRESS_HERE>

### Contract Verification
The final step for the MainNet deployment is the contract verificationSmart contract verification.

This can be dome on [Etherscan](https://etherscan.io/address/<REAL_ADDRESS_HERE>).
- Click on the `Contract Creation` link in the `to` column
- Click on the `Contract Code` link

Fill in the following data.
```
Contract Address:       <REAL_ADDRESS_HERE>
Contract Name:          IcoCrowdsale
Compiler:               v0.4.18+commit.9cf6e910
Optimization:           YES
Solidity Contract Code: <Copy & Paste from ./build/bundle/IcoCrowdsale_all.sol>
Constructor Arguments:  <ABI from sonnguyen.ws>
```

- paste the result from [ABI generator](https://abi.sonnguyen.ws/) into `Constructor Arguments ABI-encoded`
- Confirm you are not a robot
- Hit `verify and publish` button

Now your smart contract is verified.

#### Generate Contructor ABI
Go to this [ABI generator](https://abi.sonnguyen.ws/) and fill in the following properties from ico.cnf.json.
```
uint256 <startTime>,
uint256 <endTime>,
uint256 <rateChfPerEth>,
address <wallet>,
uint256 <confirmationPeriodDays>,
address <underwriter>
```
Hit `generate ABI` and `copy`.
