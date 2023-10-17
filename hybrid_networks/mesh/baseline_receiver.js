const WebSocket = require('ws');
const ntpClient = require('ntp-client');

var endTimeE2E = 0;

async function main(){
  const wss = new WebSocket.Server({ port: 3000 });

  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
    ntpClient.getNetworkTime("pool.ntp.org", 123, (err, date) => {
      if (err) {
        console.error(err);
        return;
      }
  
      endTimeE2E = date.getTime();
      console.log("E2E: ", endTimeE2E);
      });

      console.log(`Received message: ${message}`);
      const data = "senderReceiver";
      
      // Send VC receiver
      ws.send(JSON.stringify(data));
      
    });
  });

}

main();