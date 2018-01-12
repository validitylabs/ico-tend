# ICO for TEND

## Crowdsale Features:
* 13 million total token cap
    * 9.5 million presale & crowdsale cap
    * 1.5 million team cap - vested
    * 2 million company cap - vested
* Vested tokens - 1 year cliff - 365 days
    * 1/4 available after 1 year - 365 days
    * 1/36th availabe after every 30 days
    * non-recovable
* mintTokenPreSale() - function for alloting tokens for presale investors that paid in fiat. Still requires confirmation and settlement
* buyTokens() - requires confirmation and settlement
* Discounts:
    1st 3 million    -  20% discount -  1 token = 8 CHF
    2nd 3 million    -  10% discount -  1 token = 9 CHF
    last 3.5 million -  0% discount  -  1 token = 10 CHF
* Bank Frick can only call finalize()
* mintTeamTokens(uint256 amount) - mints up to 1.5 million tokens that are vested over 4 years
* mintCompanyTokens - mints 2 million tokens that are vested over 4 years

## Token Features:

TODO: finish & verify features
TODO: include deployment to mainnet instructions

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
