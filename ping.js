import axios from 'axios';


export default async function ping(message) {
    // await axios.post('https://slack.com/api/chat.postMessage', { 
    //     channel: process.env.SLACK_CHANNEL_ID,
    //     text: message
    // }, { headers: { 'Authorization': `Bearer ${process.env.SLACK_TOKEN}`, 'Content-Type': 'application/json' } });

    console.log(message)
}
