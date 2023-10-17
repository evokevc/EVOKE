const WebSocket  = require('ws');
const {
  initializeWasm,
  MembershipWitness,
  PositiveAccumulator,
  Accumulator
} = require("@docknetwork/crypto-wasm-ts");

const ntpClient = require('ntp-client');

function stringToBytes(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

async function get_mock_accumulator(){
  await initializeWasm();

  const label = stringToBytes("My sig params");
  // Deterministically generated params
  const params = PositiveAccumulator.generateParams(label);

  // Generating a keypair
  const keypair = PositiveAccumulator.generateKeypair(params);
  const sk      = keypair.sk
  const pk      = keypair.pk

  // Initialize the accumulator
  const accumulator = PositiveAccumulator.initialize(params);

  const encoder = new TextEncoder();

  const verifiableCredentialSender = {
    "@context": "https://www.w3.org/2018/credentials/v1",
    "type": ["VerifiableCredential", "IoTDeviceCredential"],
    "issuer": "did:example:123456789abcdefghi",
    "issuanceDate": "2023-06-26T12:00:00Z",
    "credentialSubject": {
      "id": "urn:deviceid:device123456789",
      "manufacturer": "Example Manufacturer",
      "model": "IoT123",
      "firmwareVersion": "v1.2.3"
    }
  };

  const verifiableCredentialReceiver = {
    "@context": "https://www.w3.org/2018/credentials/v1",
    "type": ["VerifiableCredential", "IoTDeviceCredential"],
    "issuer": "did:example:123456789abcdefghi",
    "issuanceDate": "2023-06-26T12:00:00Z",
    "credentialSubject": {
      "id": "urn:deviceid:device234567891",
      "manufacturer": "Example Manufacturer",
      "model": "IoT123",
      "firmwareVersion": "v1.2.3"
    }
  };

  const verifiableCredentialHub = {
    "@context": "https://www.w3.org/2018/credentials/v1",
    "type": ["VerifiableCredential", "IoTDeviceCredential"],
    "issuer": "did:example:123456789abcdefghi",
    "issuanceDate": "2023-06-26T12:00:00Z",
    "credentialSubject": {
      "id": "urn:deviceid:device345678912",
      "manufacturer": "Example Manufacturer",
      "model": "IoT123",
      "firmwareVersion": "v1.2.3"
    }
  };

  const jsonRandomCredential1 = JSON.stringify(verifiableCredentialSender)
  const bytes1 = encoder.encode(jsonRandomCredential1);
  const e2 = Accumulator.encodeBytesAsAccumulatorMember(bytes1);
  await accumulator.add(e2, sk);

  const jsonRandomCredential2 = JSON.stringify(verifiableCredentialReceiver)
  const bytes2 = encoder.encode(jsonRandomCredential2);
  const e3 = Accumulator.encodeBytesAsAccumulatorMember(bytes2);
  await accumulator.add(e3, sk);

  const jsonRandomCredential3 = JSON.stringify(verifiableCredentialHub)
  const bytes3 = encoder.encode(jsonRandomCredential3);
  const e4 = Accumulator.encodeBytesAsAccumulatorMember(bytes3);
  await accumulator.add(e4, sk);

  // Generating membership witness 
  const witnesses = [];
  witnesses.push(await accumulator.membershipWitness(e2, sk));
  witnesses.push(await accumulator.membershipWitness(e3, sk));
  witnesses.push(await accumulator.membershipWitness(e4, sk));

  return [accumulator, witnesses, params, pk];
  
}

var startTimeE2E = 0;
var endTimeTotal = 0;

async function main(){
  console.log("Sender is up!");
  const [acc, witnesses, params, pk] = await get_mock_accumulator();
  const ws = new WebSocket('ws://localhost:3000');

  ws.on('open', () => {
    const vc      = {
      "@context": "https://www.w3.org/2018/credentials/v1",
      "type": ["VerifiableCredential", "IoTDeviceCredential"],
      "issuer": "did:example:123456789abcdefghi",
      "issuanceDate": "2023-06-26T12:00:00Z",
      "credentialSubject": {
        "id": "urn:deviceid:device123456789",
        "manufacturer": "Example Manufacturer",
        "model": "IoT123",
        "firmwareVersion": "v1.2.3"
      }
    };
    const message = {
      vc: vc,
      wit: witnesses[0].value
    }

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
    const parsedMessage = JSON.parse(data);

    const wit1 = new MembershipWitness(parsedMessage.wit)
    const encoder = new TextEncoder();
    const jsonRandomCredential = JSON.stringify(parsedMessage.vc)
    const bytes = encoder.encode(jsonRandomCredential);
    const e2 = Accumulator.encodeBytesAsAccumulatorMember(bytes);
    const verify = acc.verifyMembershipWitness(e2, wit1, pk, params);

    if (verify){

      ntpClient.getNetworkTime("pool.ntp.org", 123, (err, date) => {
        if (err) {
          console.error(err);
          return;
        }
        endTimeTotal  = date.getTime();
        console.log("Total Latency: ", endTimeTotal - startTimeE2E);
      });

    }

  })
};

main();


