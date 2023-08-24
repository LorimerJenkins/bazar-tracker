import axios from "axios";


function formatU(tokens) {
    const format = (tokens / 1000000)
    return format
}


function shortenAddress(address) {
    const shortenedAddress = address.slice(0, 7) + "..." + address.slice(-7);
    return shortenedAddress;
}



async function queryTransaction(transaction) {

    // const transactionID = transaction.id

    const interaction = transaction.interaction
    const owner = shortenAddress(interaction.owner.address)

    const latestTxnTags = interaction.tags
    let input;
    for (let i = 0; i < latestTxnTags.length; i++) {
        if (latestTxnTags[i].name === 'Input') {
            input = JSON.parse(latestTxnTags[i].value);
        }
    }
    const price = formatU(input.qty)

    let NFTID
    if (input.function === 'createOrder') {
        NFTID = input.pair[1]
    } else { throw new Error('This is not a order (!createOrder)') }
    const bazarLink = 'https://bazar.arweave.dev/#/asset/' + NFTID

    const dataBuffer = (await axios.get(`https://arweave.net/${NFTID}`, { responseType: 'arraybuffer' })).data

    let contentType
    let NFTName
    const queryNFTData = (await axios.get(`https://gateway.warp.cc/gateway/contract?txId=${NFTID}`)).data
    const NFTDataTags = queryNFTData.contractTx.tags
    for (let i = 0; i < NFTDataTags.length; i++) {
        if (atob(NFTDataTags[i].name) === 'Content-Type') {
            contentType = atob(NFTDataTags[i].value)
        }
        if (atob(NFTDataTags[i].name) === 'Init-State') {
            NFTName = JSON.parse(atob(NFTDataTags[i].value)).name
        }
    }

    return {
        'owner': owner,
        'price': price,
        'NFTName': NFTName,
        'bazarLink': bazarLink,
        'data': { 'dataBuffer': dataBuffer, 'contentType': contentType }
    }

}


export default async function queryBazar() {


    const lastIndexedTransactions = JSON.parse(process.env.lastIndexedTransactions)
    const params = {
        contractId: 'tfalT8Z-88riNtoXdF5ldaBtmsfcSmbMqWLh2DHJIbg',
        limit: 15,
        totalCount: true,
        page: 1
    };
    const contract = await axios.get('https://gw.warp.cc/sonar/gateway/interactions-sonar', { params })
    const latestTransactions = contract.data.interactions

    let currentIndexedTransactions = []

    for (let i = 0; i < latestTransactions.length; i++) {
        let transactionID = latestTransactions[i].interaction.id
        currentIndexedTransactions.push(transactionID)
    }

    let newTransactions = [];
    for (let value of currentIndexedTransactions) {
        if(!lastIndexedTransactions.includes(value)) {
            newTransactions.push(value);
        }
    }
    if (newTransactions.length === 0) {
         console.log('No new transactions')
        return false
    }

    
    const purchases = []
    for (let i = 0; i < newTransactions.length; i++) {
        const transaction = latestTransactions[i]
        let query = await queryTransaction(transaction)
        if (query) {
            purchases.push(query)
        }
    }

    return purchases



}

