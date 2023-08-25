const fs = require('fs');

require('dotenv').config(); // Add this line at the top of your file

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');

puppeteer.use(StealthPlugin());

const MAX_AFFORDABLE_PRICE = 3;

// Read from .env file
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const sendTelegramMessage = async (message) => {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message
    });
    console.log('Message sent via Telegram');
  } catch (error) {
    console.error(`Failed to send Telegram message: ${error}`);
  }
};

const scrape = async () => {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto('https://goblin420.com/', { waitUntil: 'domcontentloaded' });

    const products = await page.evaluate(() => {
      const productElements = document.querySelectorAll('.product-tile');
      const productData = [];
      productElements.forEach((productElement) => {
        const productName = productElement.querySelector('.tile__heading').innerText;
        const productPriceText = productElement.querySelector('.tile__price').innerText;
        const productPrice = parseFloat(productPriceText.replace(/[^0-9.]/g, ''));
        productData.push({ name: productName, price: productPrice });
      });
      return productData;
    });

    await browser.close();

    const affordableProducts = products.filter(product => product.price <= MAX_AFFORDABLE_PRICE);

    if (affordableProducts.length > 0) {
      const affordableProductNames = affordableProducts.map(product => `${product.name} ($${product.price})`).join(', ');
      await sendTelegramMessage(`Affordable products found: ${affordableProductNames}`);
      clearInterval(scrapeInterval);
      console.log('Program stopped as affordable products were found.');
    } else {
      console.log('No affordable products, no message sent');
    }

  } catch (error) {
    console.error('An error occurred:', error);
  }
};

// Run the scrape function initially
scrape();

// Then run it every 15 seconds
const scrapeInterval = setInterval(scrape, 15000);