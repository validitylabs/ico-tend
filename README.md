# ICO for TEND

## Requirements
The server side scripts requires NodeJS 8.
Go to [NodeJS](https://nodejs.org/en/download/) and install the appropriate version for your system.

Yarn is required to be installed globally to minimize the risk of dependency issues.
Go to [Yarn](https://yarnpkg.com/en/docs/install) and choose the right installer for your system.

Depending on your system the following components might be already available or have to be provided manually:
* Python 2.7
* make (on Ubuntu this is part of the commonly installed `sudo apt-get install build-essential`)
* On OSX the build tools included in XCode are required

## General
Before running the provided scripts, you have to initialize your current terminal via `source ./initShell.sh` for every terminal in use. This will add the current directory to the system PATH variables and must be repeated for time you start a new terminal window from project base directory.
```
cd <project base directory>
source ./initShell.sh
```

__Every command must be executed from within the projects base directory!__

## Setup
Open your terminal and change into your project base directory. From here, install all needed dependencies.
```
cd <project base directory>
source ./initShell.sh
yarn install
```
This will install all required dependecies in the directory _node_modules_.

### Deploy smart contract
To deploy the ICO smart contracts, go into the projects root directory, and run the migration script.
```
cd <project base directory>
source ./initShell.sh
yarn run compile
yarn run migrate
```

### Run the tests
To run the unit and coverage tests, go into the projects root directory and run these test scripts.
```
cd <project base directory>
source ./initShell.sh
yarn run test
yarn run coverage
```
