import queryBazar from './queryBazar.js';
import ping from './ping.js'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function mainLoop() {
  while (true) {
    const newTrades = await queryBazar();

    if (newTrades !== false) {
      await ping(newTrades)
    }

    await delay(20000);
  }
}

mainLoop().catch((error) => {
  console.error('An error occurred:', error);
});

console.log('Query Bazar: **LIVE**')

