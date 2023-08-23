import axios from 'axios'


function formatU(tokens) {
    const format = (tokens / 1000000)
    return format
}


export default async function queryBazar() {

    const params = {
        contractId: 'tfalT8Z-88riNtoXdF5ldaBtmsfcSmbMqWLh2DHJIbg',
        limit: 15,
        totalCount: true,
        page: 1
    };
    const contract = await axios.get('https://gw.warp.cc/sonar/gateway/interactions-sonar', { params })
    const latestTransactions = contract.data.interactions

    const latestTxn = latestTransactions[0].interaction
    const transactionID = latestTxn.id
    const owner = latestTxn.owner.address

    const latestTxnTags = latestTxn.tags
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
        'transactionID': transactionID,
        'price': price,
        'NFTName': NFTName,
        'bazarLink': bazarLink,
        'NFTID': NFTID,
        'data': { 'dataBuffer': dataBuffer, 'contentType': contentType }
    }

}



