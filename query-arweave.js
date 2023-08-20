import dotEnv from 'dotenv'
dotEnv.config()

import Arweave from 'arweave';
import Heroku from 'heroku-client';
import queryTransactionIDsBetweenBlocks from './arweaveGQL.js';


const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
});


async function updateHerokuFn(key, value) {
    const heroku = new Heroku({ token: process.env.HEROKU_API_KEY });
    const appName = 'query-bazar';
    const configVars = { [key]: value };
    try {
        await heroku.patch(`/apps/${appName}/config-vars`, { body: configVars });
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}



async function queryBlock(lastFullBlock, currentBlock) {
    const previousBlocksTxns = (await arweave.blocks.get(lastFullBlock)).txs;
    let uniqueTags = [];
    const txnPromises = previousBlocksTxns.map(async (txn) => {
        try {
            const transaction = await arweave.transactions.get(txn);
            const tags = transaction.get('tags');
            tags.map((tag) => {
                const decodedTag = {
                    name: tag.get('name', { decode: true, string: true }),
                    value: tag.get('value', { decode: true, string: true }),
                    count: 1
                };

                const existingTagIndex = uniqueTags.findIndex((tag) => tag.name === decodedTag.name && tag.value === decodedTag.value);

                if (existingTagIndex !== -1) {
                    uniqueTags[existingTagIndex].count++;
                } else {
                    uniqueTags.push(decodedTag);
                }
            });
        } catch (e) {
            console.log('Error:', e)
        }
    });

    await Promise.all(txnPromises);

    const saveLastFullBlock = await updateHerokuFn('lastIndexedBlock', lastFullBlock);
    if (saveLastFullBlock === false) {
        throw newError('Failed to update lastIndexedBlock!');
    }
    const savelastCurrentBlock = await updateHerokuFn('lastCurrentBlock', currentBlock);
    if (savelastCurrentBlock === false) {
        throw newError('Failed to update lastCurrentBlock!');
    }

    return { block: lastFullBlock, tags: uniqueTags }

}




async function queryTransactions(missedTransactions, lastIndexedBlock) {

    let uniqueTags = [];
    const txnPromises = missedTransactions.map(async (txn) => {
        try {
            const transaction = await arweave.transactions.get(txn);
            const tags = transaction.get('tags');
            tags.map((tag) => {
                const decodedTag = {
                    name: tag.get('name', { decode: true, string: true }),
                    value: tag.get('value', { decode: true, string: true }),
                    count: 1
                };

                const existingTagIndex = uniqueTags.findIndex((tag) => tag.name === decodedTag.name && tag.value === decodedTag.value);

                if (existingTagIndex !== -1) {
                    uniqueTags[existingTagIndex].count++;
                } else {
                    uniqueTags.push(decodedTag);
                }
            });
        } catch (e) {
            // ignore gateway errors
        }
    });

    await Promise.all(txnPromises);


    return { block: lastIndexedBlock, tags: uniqueTags }

}





function shortenAddress(address) {
    const shortenedAddress = address.slice(0, 7) + '...' + address.slice(-7);
    return shortenedAddress;
}

export default async function listenForTransactions() {
    const queryBlocks = await arweave.blocks.getCurrent();
    const currentBlock = queryBlocks.indep_hash
    const currentFullBlock = queryBlocks.previous_block;
    const lastCurrentBlock = process.env.lastCurrentBlock
    const lastIndexedBlock = process.env.lastIndexedBlock

    const currentDate = new Date();

    if (currentFullBlock === lastIndexedBlock) {
        
        console.log(`NO new block. currentBlock: ${shortenAddress(currentBlock)}. currentFullBlock: ${shortenAddress(currentFullBlock)}. Current time: ${currentDate.toLocaleString()}.`)
    
        return false
        
    } else if (currentFullBlock === lastCurrentBlock) {
        
        console.log(`NEW block. currentBlock: ${shortenAddress(currentBlock)}. currentFullBlock: ${shortenAddress(currentFullBlock)}. Current time: ${currentDate.toLocaleString()}.`)
        const transactionTags = await queryBlock(currentFullBlock, currentBlock);
        return transactionTags;

    } else if (currentFullBlock !== lastCurrentBlock) {
        
        console.log(`We have MISSED blocks. currentBlock: ${shortenAddress(currentBlock)}. currentFullBlock: ${shortenAddress(currentFullBlock)}. Current time: ${currentDate.toLocaleString()}.`)
        const missedTransactions = await queryTransactionIDsBetweenBlocks(lastCurrentBlock, currentFullBlock)
        const transactionTags = await queryTransactions(missedTransactions, lastIndexedBlock)

        const saveLastFullBlock = await updateHerokuFn('lastIndexedBlock', currentFullBlock);
        if (saveLastFullBlock === false) {
            throw newError('Failed to update lastIndexedBlock!');
        }
        const savelastCurrentBlock = await updateHerokuFn('lastCurrentBlock', currentBlock);
        if (savelastCurrentBlock === false) {
            throw newError('Failed to update lastCurrentBlock!');
        }

        return transactionTags

    }

}