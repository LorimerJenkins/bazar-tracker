import { TwitterApi } from 'twitter-api-v2';


export default async function sendTweet(imageBuffer, contentType) {

    const message = `-- just brought etc`

    const twitterClient = new TwitterApi({
        // appKey: process.env.TWITTER_API_KEY,
        // appSecret: process.env.TWITTER_API_SECRET,
        // accessToken: process.env.TWITTER_ACCESS_TOKEN,
        // accessSecret: process.env.TWITTER_ACCESS_SECRET
    });

    try {
        const mediaUpload = await twitterClient.v2.uploadMedia.init({
            media_data: imageBuffer,
            media_type: contentType,
        });

        const mediaId = mediaUpload.media_id_string;

        const tweetParams = {
            status: message,
            media_ids: [mediaId],
        };

        await twitterClient.v2.tweets.create(tweetParams);
        console.log("Tweeted!");

    } catch (err) {
        console.error("Error posting tweet with media:", err);
    }
}
