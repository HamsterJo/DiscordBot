const Net = require('net');
const puppeteer = require('puppeteer');

const port = 8080;
const host = 'localhost'; //"192.168.3.116"//

const client = new Net.Socket();

client.connect({
  port: port,
  host: host 
}, () => {
  console.log('Connection established');
});

client.on('data', (buffer) => {
  console.log(buffer.toString());
});

client.on('error', (error) => {
  //console.log('Error : ' + error);
});

client.on('close', (error) => {
  console.log('Connection closed');
});


(async () => {
  let browser;
  if(process.platform == "win32"){
      browser = await puppeteer.launch({
    headless: true
  });
  } else {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/chromium-browser'
    });
  }

  const page = await browser.newPage();
  await page.goto('https://csgo500.com');

  console.log('Sending Train value');

  try {
    await page.waitForSelector('.ht-progress-bubble', {
      timeout: 1000
    });
    setInterval(async () => {
      const value = await page.$eval('.ht-progress-bubble', e => e.firstElementChild.firstElementChild.innerText);
      client.write(await valuereplace(/[.,]/g,""));
    }, 500);
  } catch (error) {
    console.log('[ERROR]> ' + error);
  }
})();

/*
setInterval(async () => {
    let value = await page.evaluate(() => {
      // Select the node that will be observed for mutations
      var targetNode = document.getElementsByClassName('ht-progress-bubble')[0].firstElementChild.firstElementChild;
      return targetNode.innerText;
    });

    client.write(await value);
  }, 100);
*/

/*
DETEDCT IF AN "targetNode" HAS CHANGED!!
// Options for the observer (which mutations to observe)
var config = {
  attributes: true,
  childList: true
};

// Callback function to execute when mutations are observed
var callback = function (mutationsList) {
  for (var mutation of mutationsList) {
    if (mutation.type == 'childList') {
      console.log('A child node has been added or removed.');
    }
  }
};

// Create an observer instance linked to the callback function
var observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(targetNode, config);
*/