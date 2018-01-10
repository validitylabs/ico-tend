'use strict';

require('babel-polyfill');

const env   = process.env.NODE_ENV  || 'development';
const bnode = env === 'production' ? 'node' : 'babel-node';

if (env !== 'production') {
    require('babel-register');
}

const {spawn}   = require('child_process');
const log       = require('./logger').logger;
const kill      = require('tree-kill');

if (!process.env.TASK) {
    log.error('No task passed!');
    process.exit(1);
}

const task      = process.env.TASK;
const processes = [];
let tasks       = {};
let dead        = false;

log.info('======================================================');
log.info('[ Args ]');
log.info('ENV\t: ' + env.toUpperCase());
log.info('Task\t: ' + task.toUpperCase());
// log.info('argv :\t' + process.argv.toString());
log.info('======================================================');

/**
 * Do a clean exit and kill all (child) processes properly
 *
 * @returns {void}
 */
function cleanExit() {
    if (!dead) {
        kill(process.pid);
        dead = true;
    }
}

/**
 * Listen to all process events
 *
 * @param {object} p Process
 * @returns {void}
 */
function listen(p) {
    p.on('exit', (code, signal) => {
        cleanExit();
    });

    p.on('SIGINT', cleanExit);    // Catch ctrl-c
    p.on('SIGTERM', cleanExit);   // Catch kill

    p.on('error', (err) => {
        log.error('onError:');
        log.error(err);
        p.exit(1);
    });

    p.on('uncaughtException', (err) => {
        log.error('onUncaughtException:');
        log.error(err);
        p.exit(1);
    });
}

// Task runner configurations
switch (task) {
    case 'compile':
        tasks = {
            compile:    'truffle compile --all'
        };
        break;
    case 'migrate':
        tasks = {
            server:     bnode + ' ./tools/server',
            migrate:    'truffle migrate --reset --compile-all --network develop'
        };
        break;
    case 'test':
        tasks = {
            server:             bnode + ' ./tools/server',
            // migrate:            'truffle migrate --reset --compile-all --network develop',
            testIcoToken:       'truffle test test/contracts/ico/IcoToken.js --network develop'
            // ,
            // testIcoCrowdsale:   'truffle test test/contracts/ico/IcoCrowdsale.js --network develop'
        };
        break;
    default:
}

// Listen to sub processes
log.info('[ Task queue ]');
Object.keys(tasks).forEach((task) => {
    log.info(task + '\t: ' + tasks[task]);
    processes[task] = task;

    processes[task] = spawn(tasks[task], {
        stdio: 'inherit',
        shell: true
    });
    listen(processes[task]);
});

// Listen to main process
listen(process);
