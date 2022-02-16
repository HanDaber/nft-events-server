import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

import { DB, Event, BlockSpan } from "@handaber/nft-events-models";

dotenv.config({ path: __dirname + '/../.env' });

const { CONTRACT_ADDRESS, NODE_ENDPOINT } = process.env;

console.log('scan', { CONTRACT_ADDRESS })

const nodeEndpoint = NODE_ENDPOINT ? NODE_ENDPOINT : 'http://localhost:8545';
const contractAddress = CONTRACT_ADDRESS ? CONTRACT_ADDRESS : '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D'; // Default to BAYC

let models: any;

processNextBlockSpan();
setInterval(processNextBlockSpan, 1000 * 60); // Once per minute
/*
    Starts at the first block plus offset 
    and scans consecutive spans of blocks 
    with a specified range until the current block
*/
async function processNextBlockSpan() {
    try {
        const ethereumClient = new ethers.providers.JsonRpcProvider(nodeEndpoint);

        await DB.connect(async (connection: any) => {
            models = connection;
        });

        const latestBlock = await ethereumClient.getBlockNumber();
        console.log({ latestBlock })

        const lastProcessedSpan = await models.manager.findOne(BlockSpan, {
            order: { id: 'DESC' }
        });
        console.log({ lastProcessedSpan })

        if( lastProcessedSpan.toBlock < latestBlock ) {
            const newSpan = new BlockSpan();

            const processing = await models.manager.save(newSpan);
            console.log({ processing })

            await startScan(processing.fromBlock, processing.toBlock);

            processing.setComplete();

            await models.manager.save(processing);

            // const foundItAgain = await models.manager.findOne(BlockSpan, processing.id);
            // console.log({ foundItAgain })
        }

        await models.close();

    } catch (error) {
        console.error(error);
    }
};

async function startScan(fromBlock: number, toBlock: number) {
    console.log('query eth node')
    const logs = await queryNodeForContractLogsInBlockRange(contractAddress, 14201104);
    console.log(`received ${logs.length} logs`);

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