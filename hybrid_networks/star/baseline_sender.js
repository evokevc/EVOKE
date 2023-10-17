const WebSocket  = require('ws');
const ntpClient = require('ntp-client');

var startTimeE2E = 0;
var endTimeTotal = 0;

async function main(){
  console.log("Sender is up!");

  const ws = new WebSocket('ws://localhost:3000');

  ws.on('open', () => {
    
    const message = "senderMessage";

    ntpClient.getNetworkTime("pool.ntp.org", 123, (err, date) => {
      if (err) {
        console.error(err);
        return;
      }

    startTimeE2E = date.getTime();
    console.log("E2E: ", startTimeE2E);

    // Send VC to the hub
    ws.send(JSON.stringify(message));
    });
  });

  // Get receiver VC 
  ws.on('message', (data) => {

    console.log(`Received message: ${data}`);
    ntpClient.getNetworkTime("pool.ntp.org", 123, (err, date) => {
      if (err) {
        console.error(err);
        return;
      }
      endTimeTotal  = date.getTime();
      console.log("Total Latency: ", endTimeTotal - startTimeE2E);
    });
  })
};

main();


