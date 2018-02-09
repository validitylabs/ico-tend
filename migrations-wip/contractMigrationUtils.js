import * as fs from 'fs';
import * as csv from 'fast-csv';
import * as mtnCrowdsaleBuild from '../build/bundle/MtnCrowdsale.sol.js';

const splitArrayInChunks = (array, chunkSize, manipulate = (chunk) => chunk) => {
    let index = 0;
    const arrayLength = array.length;
    const chunks = [];

    for (index = 0; index < arrayLength; index += chunkSize) {
        chunks.push(manipulate(array.slice(index, index + chunkSize)));
    }

    return chunks;
};

const parseCsvFile = (file, onFinished, parserOptions = {}) => {
    const rows = [];
    const stream = fs.createReadStream(file);

    csv.fromStream(stream, parserOptions)
        .on('data', (data) => {
            rows.push(data);
        })
        .on('end', () => {
            onFinished(rows);
        });
};

export const whiteListInvestors = (contract, managerAddress, csvFilePath) => {
    parseCsvFile(csvFilePath, (data) => {
        const addresses = data.map((row) => row[0]);
        const chunks = splitArrayInChunks(addresses, 200);

        chunks.forEach(async (chunk, index) => {
            try {
                await contract.methods.batchWhiteListInvestors(chunk).send({from: managerAddress});
            } catch (error) {
                console.error(`whiteListInvestors error in chunk ${index}`, error);
            }
        });
    });
};

const testMintTokenPresaleData = (rows, chunks) => {
    let countChunkItemsAddresses = 0;
    let countChunkItemsAmounts = 0;

    chunks.forEach(async (chunk) => {
        countChunkItemsAddresses += chunk.addresses.length;
        countChunkItemsAmounts += chunk.amounts.length;
    });

    console.log('rows count', rows.length);
    console.log('chunk item count (addresses)', countChunkItemsAddresses);
    console.log('chunk item count (amounts)', countChunkItemsAmounts);
    console.log('chunks count', chunks.length);

    console.log('compare row with chunk 1', (rows[0][0] === chunks[0].addresses[0] && rows[0][1] === chunks[0].amounts[0]));
    console.log('compare row with chunk 15', (rows[15][0] === chunks[0].addresses[15] && rows[15][1] === chunks[0].amounts[15]));
    console.log('compare row with chunk 199', (rows[199][0] === chunks[0].addresses[199] && rows[199][1] === chunks[0].amounts[199]));
    console.log('compare row with chunk 400', (rows[400][0] === chunks[2].addresses[0] && rows[400][1] === chunks[2].amounts[0]));
    console.log('compare row with chunk 575', (rows[575][0] === chunks[2].addresses[175] && rows[575][1] === chunks[2].amounts[175]));
    console.log('compare row with chunk 1999', (rows[1999][0] === chunks[9].addresses[199] && rows[1999][1] === chunks[9].amounts[199]));
    console.log('compare row with chunk 2156', (rows[2156][0] === chunks[10].addresses[156] && rows[2156][1] === chunks[10].amounts[156]));
};

/* eslint-disable max-params */
export const mintTokenPresale = (contract, managerAddress, csvFilePath, offset = null, limit = null) => {
    parseCsvFile(csvFilePath, (rows) => {
        // remove csv header:
        // const rows = data.slice(1, data.length);

        const chunks = splitArrayInChunks(rows, 120, (chunk) => {
            // manipulate the object structure to match the api of the contract
            // @TODO amounts = binumber?
            return {
                addresses: chunk.map((item) => item[0]),
                amounts: chunk.map((item) => item[1])
            };
        });

        // testMintTokenPresaleData(rows, chunks);

        if (offset === null) {
            chunks.forEach(async (chunk, index) => {
                try {
                    console.log(`deploy chunk ${index}`);
                    await contract.methods.batchMintTokenPresale(chunk.addresses, chunk.amounts).send({from: managerAddress});
                } catch (error) {
                    console.error(`mintTokenPresale error in chunk ${index}`, error);
                }
            });
        } else {
            const sliceEnd = offset + limit;
            console.log(`offset and limit provided! Only the chunks ${offset} to ${sliceEnd}`);

            if (sliceEnd > chunks.length) {
                throw new Error(`The limit of "${limit}" is located outside the length of the array "${chunks.length}" by an offset from "${offset}".`);
            }

            chunks.slice(offset, sliceEnd).forEach(async (chunk, index) => {
                try {
                    console.log(`deploy chunk ${chunks.indexOf(chunk) + 1} of ${chunks.length}`);
                    await contract.methods.batchMintTokenPresale(chunk.addresses, chunk.amounts).send({from: managerAddress});
                } catch (error) {
                    console.error(`mintTokenPresale error in chunk ${index}`, error);
                }
            });
        }
    });
};
/* eslint-enable max-params */

export const setManager = async (contract, activeManagerAddress, address, active = true) => {
    try {
        await contract.methods.setManager(address, active).send({from: activeManagerAddress});
    } catch (error) {
        console.error('setManager error', error);
    }
};

export const transferOwnership = async (contract, owner, newOwner) => {
    try {
        await contract.methods.transferOwnership(newOwner).send({from: owner});
    } catch (error) {
        console.error('transferOwnership error', error);
    }
};

/* eslint-disable max-params */
export const getContract = (web3, contractAddress, owner, gasPrice, gas) => {
    const abi = mtnCrowdsaleBuild.MtnCrowdsaleAbi;
    const bytecode = mtnCrowdsaleBuild.MtnCrowdsaleByteCode;

    return new web3.eth.Contract(
        abi,
        contractAddress,
        {
            gasPrice: gasPrice,
            gas: gas,
            data: bytecode,
            from: owner
        }
    );
};
/* eslint-enable max-params */
