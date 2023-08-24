import queryBazar from "./queryBazar.js";
import dispatchTweets from "./dispatchTweets.js";


const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


async function mainLoop() {
  while (true) {
    const purchases = await queryBazar();

    if (purchases) {
      await dispatchTweets(purchases)
    }
    
    await delay(30000);
  }
}

mainLoop().catch((error) => {
  console.error('An error occurred:', error);
});

console.log('Query Bazar: **LIVE**')

