import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

import { DB, Event, BlockSpan } from "@handaber/nft-events-models";

dotenv.config({ path: __dirname + '/../.env' });

const { CONTRACT_ADDRESS, NODE_ENDPOINT, SCAN_START_BLOCK, SCAN_CHUNK_SIZE } = process.env;

console.log('scan', { CONTRACT_ADDRESS, NODE_ENDPOINT, SCAN_START_BLOCK, SCAN_CHUNK_SIZE })

const nodeEndpoint = NODE_ENDPOINT ? NODE_ENDPOINT : 'http://localhost:8545';
const contractAddress = CONTRACT_ADDRESS ? CONTRACT_ADDRESS : '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D'; // Default to BAYC

let models: any = null;
// This interval and trigger logic can be pulled out to the infra layer
const syncInterval = 1000 * 20; // 20 seconds (likely capture at least one block)
// const backfillInterval = 1000; // 1 second (for backfill)
const backfillInterval = 10 * 1000; // 10 second (for testing backfill)
let scanInterval = backfillInterval; // default to backfill

checkNextJob();
setInterval(checkNextJob, scanInterval); // Start
/*
    Starts at the first block plus offset 
    and scans consecutive spans of blocks 
    with a specified range until the current block
*/
async function checkNextJob() {
    try {
        const ethereumClient = new ethers.providers.JsonRpcProvider(nodeEndpoint);

        models = await connectDB();

        const latestBlock = await ethereumClient.getBlockNumber();
        console.log({ latestBlock })

        const lastProcessedSpan = await models.manager.findOne(BlockSpan, {
            order: { id: 'DESC' }
        });
        console.log({ lastProcessedSpan })
        
        /* not exists means it is the first in the database
           less than means we are still behind the latest block 
           if equal then this block is already included in the last scan
        */
        if( !lastProcessedSpan || lastProcessedSpan.toBlock < latestBlock ) {
            const ok = await backfillNextBlockSpan();
            console.log({ ok })
        } else if( lastProcessedSpan.fromBlock <= latestBlock ) { // partial blockSpan, we are caught up on backfilling
            scanInterval = syncInterval;
            
            // await startScan(lastProcessedSpan.fromBlock, latestBlock); // switch to syncing up to latest block
        } else { // we are ahead of the latest block, no-op
            console.log('We are ahead of the latest block, m8. no-op')
            console.log(`Last processed fromBlock: ${lastProcessedSpan.fromBlock}, latest block: ${latestBlock}`)
        }

        // await models.close();

    } catch (error) {
        console.error(error);
    }
};

async function backfillNextBlockSpan() {
    const newSpan = new BlockSpan();

    const processing = await models.manager.save(newSpan);
    console.log({ processing })

    await startScan(processing.fromBlock, processing.toBlock);

    processing.setComplete();

    await models.manager.save(processing);

    // const foundItAgain = await models.manager.findOne(BlockSpan, processing.id);
    // console.log({ foundItAgain })
};

async function startScan(fromBlock: number, toBlock: number) {
    console.log('query eth node')
    const logs = await queryNodeForContractLogsInBlockRange(contractAddress, fromBlock, toBlock);
    console.log(`received ${logs.length} logs`);

    if( logs.length < 1 ) return;

    console.log('parse logs')
    const events = await parseContractLogs(contractAddress, logs);
    console.log(`parsed ${events.length} events`);

    console.log('insert events')
    await insertNewEvents(events);
}

async function queryNodeForContractLogsInBlockRange(address: string, fromBlock: number, toBlock?: number) {
    try {
        const ethereumClient = new ethers.providers.JsonRpcProvider(nodeEndpoint);

        if (!toBlock) toBlock = await ethereumClient.getBlockNumber();

        const filter = { fromBlock, toBlock, address };
        const logs = await ethereumClient.getLogs(filter);

        return logs;
    } catch (error) {
        console.error(error);
        return [];
    }
}

/* Notes:
example log: {
    blockNumber: 14201769,
    blockHash: '0x73baec8005aa061e5837124eb0b00505983a2d65f4aac9cb468f178aa2ea8f16',
    transactionIndex: 132,
    removed: false,
    address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
    data: '0x',
    topics: [Array],
    transactionHash: '0x8fe1909d8652cee24c8adc334d0817b0acfaacad7238998005bd5fc73b3f89c7',
    logIndex: 249
}
 */
async function parseContractLogs(contractAddress: String, logs: any[]) {
    try {
        // TODO: Download/persist ABI if not exist
        const contractAbi = require(`../abis/${contractAddress}.json`);
        const baycIface = new ethers.utils.Interface(contractAbi);

        let events = logs.map((log) => {
            const { name, args } = baycIface.parseLog(log);

            return { type: name, args: JSON.stringify(args) };
        });

        return events;
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function insertNewEvents(events: any[]) {
    const response = await models
        .createQueryBuilder()
        .insert()
        .into(Event)
        .values(events)
        .execute();

    console.log(`inserted ${response.raw.length} events`);
}

async function connectDB() {
    if(!models) await DB.connect(async (connection: any) => {
        models = connection;
        console.log('got the connection')
    });

    console.log('postcondude')

    return models;
}