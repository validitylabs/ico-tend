/**
 * Test for IcoCrowdsale
 *
 * yarn run dev
 * > test ./test/contracts/IcoCrowdsale.js
 */

const IcoCrowdsale = artifacts.require('./IcoCrowdsale');

import {startTime, endTime, rateEthPerToken} from '../../ico.cnf.json';
import {waitNDays, getEvents, debug, BigNumber} from './helpers/tools'; // eslint-disable-line

const moment        = require('moment'); // eslint-disable-line
const assertJump    = require('./helpers/assertJump');

const should = require('chai') // eslint-disable-line
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

/**
 * IcoToken contract
 */
contract('IcoCrowdsale', (accounts) => {
    const owner             = accounts[0];
    const activeManager1    = accounts[1];
    const wallet            = accounts[6];

    // Provide icoTokenInstance for every test case
    let icoCrowdsaleInstance;
    beforeEach(async () => {
        icoCrowdsaleInstance = await IcoCrowdsale.deployed();
    });

    it.skip('should do something', async () => {
        console.log('[ CROWDSALE ]');
    });
});
