const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");

const targetUrl = "https://httpbin.org/ip";

// List of proxies
const proxies = [
  {
    host: "proxy.wtvconfigs.run.place",
    port: 8069,
    username: "7365347141",
    password: "uKxkcFMVYv9nsaNK",
  },
];

async function testProxy(proxy) {
  try {
    let proxyUrl;

    if (proxy.username && proxy.password) {
      proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
    } else {
      proxyUrl = `http://${proxy.host}:${proxy.port}`;
    }

    const agent = new HttpsProxyAgent(proxyUrl);

    const response = await axios.get(targetUrl, {
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 10000,
    });

    console.log(`SUCCESS ${proxy.host}:${proxy.port}`);
    console.log(response.data);
  } catch (err) {
    console.log(`FAILED ${proxy.host}:${proxy.port}`);
    console.log(err.message);
  }

  console.log("--------------------------------");
}

async function run() {
  for (const proxy of proxies) {
    await testProxy(proxy);
  }
}

run();
