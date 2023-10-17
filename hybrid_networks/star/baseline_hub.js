const WebSocket = require('ws');

async function main(){
  console.log("Hub is up!");
  const wss = new WebSocket.Server({ port: 3000 });
  
  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      console.log(`Message received successfully from the sender: ${message}`);

      const wsc= new WebSocket('ws://localhost:4000');
      wsc.on('open', () => {   
        // Forward sender VC
        wsc.send(message);
      });

      wsc.on('message', (data) => {
        console.log(`Message received successfully from the receiver: ${data}`);
        // Forward receiver VC
        ws.send(data);
      });

      });

  });
}

main();