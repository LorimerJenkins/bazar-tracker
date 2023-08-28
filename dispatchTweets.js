import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import axios from "axios";
dotenv.config();




async function getCurrentStreak(walletAddress) {
    let streak = await axios.get(`https://dre-u.warp.cc/contract?id=tfalT8Z-88riNtoXdF5ldaBtmsfcSmbMqWLh2DHJIbg&events=false`);
    try {
        streak = streak.data.state.streaks[walletAddress].days
        return streak    
    } catch (error) {
        return 0
    }
}



async function sendTweet(purchaseData) {

    const twitterClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    try {

        const streak = await getCurrentStreak(purchaseData.owner)

        let message
        if (streak === 0) {
            message = `${purchaseData.owner} just spent ${purchaseData.price} $U on ${purchaseData.NFTName}! Check it out: ${purchaseData.bazarLink}`
        } else {
            message = `${purchaseData.owner} on streak ${streak} 🔥 just spent ${purchaseData.price} $U on ${purchaseData.NFTName}! Check it out: ${purchaseData.bazarLink}`
        }
        
        const mediaBase64 = purchaseData.data.dataBuffer;
        const mediaId = await twitterClient.v1.uploadMedia(mediaBase64, 
            { mimeType: purchaseData.data.contentType }
        );

        const tweet = await twitterClient.v2.tweet(message, {
            media: { media_ids: [mediaId] }
        });

        return tweet


    } catch (err) {
        console.error(err);
    }
}




export default async function dispatchTweets(purchases) {
    for (let i = 0; i < purchases.length; i++) {
        console.log(await sendTweet(purchases[i]))
    }
}

