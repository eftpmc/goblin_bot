const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const twilio = require('twilio');

puppeteer.use(StealthPlugin());

const MAX_AFFORDABLE_PRICE = 3; // You can change this value as needed

const accountSid = 'ACf1ec299735f3dbde4f51067a325475fa';
const authToken = '0727095d995c8a0934e7733db32c4d61';
const client = new twilio(accountSid, authToken);

const sendSMS = (message) => {
  client.messages
    .create({
      body: message,
      from: '+18666950852',
      to: '+18438164991',
    })
    .then((message) => console.log(`Message sent: ${message.sid}`))
    .catch((error) => console.error(`Failed to send SMS: ${error}`));
};

const scrape = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
    });

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
      sendSMS(`Affordable products found: ${affordableProductNames}`);
      clearInterval(scrapeInterval); // Stop the interval
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
