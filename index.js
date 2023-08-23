import queryBazar from './queryBazar.js';
import sendTweet from './sendTweet.js'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function mainLoop() {
  while (true) {
    const newPurchases = await queryBazar();

    if (newTrades !== false) {
      await sendTweet(newPurchases)
    }

    await delay(20000);
  }
}

mainLoop().catch((error) => {
  console.error('An error occurred:', error);
});

console.log('Query Bazar: **LIVE**')

