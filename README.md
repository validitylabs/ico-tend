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

## Ropsten deployment
Addresses used by our ropsten test node:
```
"from":         "0xfc54a67ba6822bb64d402b1a2d996018d8c326fa",
"wallet":       "0x3707b30b3e7CCFc14f516DeBA2aFb7042BDC58EA",
"underwriter":  "0x961b7AC7ff495207C261C4b5A9656a7032b1e5f0",
```

Connect to out ropsten test node by typing `ssh root@165.227.144.105`.
Then change into the Geth console and unlock the account for deployment.
```
attach ipc://mnt/volume-fra1-02/geth/data/geth.ipc

> personal.unlockAccount('0xfc54a67ba6822bb64d402b1a2d996018d8c326fa', "", 2700)

```
After exiting the console by `<STRG> + <D>`, simply run `yarn migrate-ropsten`.
This may take several minutes to been finished.
