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

__Because the test consumes a lot of ETH, please restart the development console between each test!__

## Run the coverage test
To run the coverage tests, go into the projects root directory and run the coverage test like that.
```
cd <project base directory>
source ./tools/initShell.sh
yarn run coverage
```
__The coverage test will automatically start it's own TestRPC server for you!__

## Rinkeby deployment
For the Rinkeby deployment, you need a Geth installation on your machine.
Follow the [installation instructions](https://github.com/ethereum/go-ethereum/wiki/Building-Ethereum) for your OS.

Start local Rinkeby test node:
```
geth --syncmode "fast" --rinkeby --rpc --rpcapi "eth,net,web3,personal"
```

Connect to local Geth console:
```
geth attach ipc://<PATH>/<TO>/Library/Ethereum/rinkeby/geth.ipc

# e.g.
# geth attach ipc://Users/patrice/Library/Ethereum/rinkeby/geth.ipc
```

Upon setup the node does not contain any private keys and associated accounts. Create an account in the web3 Geth console:
```
web3.personal.newAccount()
```
Press [Enter] twice to skip the password (or set one but then later it has to be provided for unlocking the account).

Read the address and send some Rinkeby Ether to pay for deployment and management transaction fees:
```
web3.eth.accounts
```
(You can obtain Rinkeby testnet Ether from the faucet by pasting your address in social media and pasting the link: https://www.rinkeby.io/#faucet)

Connect to your rinkeby Geth console and unlock the account for deployment.
```
> personal.unlockAccount(web3.eth.accounts[0], "", 2700)
```

Change the deployer (`from`), `wallet` and `underwriter` accounts in ico.cnf.json:
```
"from":         "0x461fcadb2530d10f7b7d4931a7c7864f755aa675",
"wallet":       "0x4e6fF5fCe21DCF91ad966DDC3aE9D8A1843Ce42A",
"underwriter":  "0xF49aC64dbFfD7AE4342ca7A0C5DBbcb95f7513e7",
```
`from` has to be the address that is used for deployment (`web3.eth.accounts[0]`), `wallet` and `underwriter` can be some other addresses (e.g. from MetaMask).

After exiting the console by `<STRG> + <D>`, simply run `yarn migrate-rinkeby`.
This may take several minutes to finish.

## Mainnet deployment
@TODO: document this
