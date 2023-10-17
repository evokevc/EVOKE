import * as identity from "@iota/identity-wasm/web"

import { 
  initializeWasm, 
  PositiveAccumulator, 
  Accumulator } from "@docknetwork/crypto-wasm-ts";

global.Buffer = require('buffer').Buffer;

function appendToConsole(message) {
  const consoleOutput = document.getElementById("consoleOutput");
  const messageParagraph = document.createElement("p");
  messageParagraph.textContent = message;
  consoleOutput.appendChild(messageParagraph);
}
  
async function createSignedVC(account, did, to_sign, type){

    // create a subject
    const subject = {
      id: did.toString(),
      type: JSON.stringify(to_sign)
  }

  // Create an unsigned credential
    const unsignedVc = new identity.Credential({
      id: "https://example.edu/credentials/3732",
      type: "Updated",
      issuer: did.toString(),
      credentialSubject: subject,
  });

  const jsonStringUnsignedVC = JSON.stringify(unsignedVc);
  const sizeInBytesUnsignedVC = new TextEncoder().encode(jsonStringUnsignedVC).length;

  var messageToAppend = "Size of unsigned VC:" + sizeInBytesUnsignedVC + "bytes, type: " + type + "\n";
  appendToConsole(messageToAppend);

  // Sign Credential.
  let signedVc = await account.createSignedCredential(did.toString().concat("#sign-0"), unsignedVc, identity.ProofOptions.default());

  const jsonStringSignedVC = JSON.stringify(signedVc);
  const sizeInBytesSignedVC = new TextEncoder().encode(jsonStringSignedVC).length;
  messageToAppend = "Size of signed VC:" + sizeInBytesSignedVC + "bytes, type: " + type + "\n";
  appendToConsole(messageToAppend);

  return signedVc;

}

(async () => {
  await initializeWasm();
  await identity.init();

  // Randomly generated params
  const paramsRandom = PositiveAccumulator.generateParams();

  // Generating a keypair
  const keypair = PositiveAccumulator.generateKeypair(paramsRandom);
  const sk      = keypair.sk
  const pk      = keypair.pk

  // Initialize the accumulator
  const accumulator = PositiveAccumulator.initialize(paramsRandom);

  const encoder = new TextEncoder();
  
  // The creation step generates a keypair, builds an identity
  // and publishes it to the IOTA mainnet.
  const builder = new identity.AccountBuilder();
  const account = await builder.createIdentity();

  // Retrieve the DID of the newly created identity.
  const did = account.did();

  // Create signed VC and add to accumulator
  const randomCredential = createSignedVC(account, did, "Sensing", "Capability");
  const jsonRandomCredential = JSON.stringify(randomCredential)
  const bytes = encoder.encode(jsonRandomCredential);
  const e2 = Accumulator.encodeBytesAsAccumulatorMember(bytes);
  await accumulator.add(e2, sk);

  // get membership witness 
  const witness = await accumulator.membershipWitness(e2, sk)

  // verify valid membership witness
  const iterations = 1000; // Number of iterations to average
  let totalTime = 0;

  //appendToConsole("Number of iterations: " + iterations);

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    console.log("Result of verify valid witness: ", accumulator.verifyMembershipWitness(e2, witness, pk, paramsRandom));
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    totalTime += executionTime;
  }

  let averageTime = totalTime / iterations;
  appendToConsole("Veryfing valid membership witness. Average execution time: " + averageTime + " milliseconds");

  // Update accumulator and witness
  const vcAccumulator = await createSignedVC(account, did, accumulator.value, "Accumulator");
  const vcUpdatedWitness = await createSignedVC(account, did, witness.value, "Witness");

  // Create signed VC and add to accumulator
  const randomCredential1 = await createSignedVC(account, did, "Sensing", "Capability");
  const jsonRandomCredential1 = JSON.stringify(randomCredential1)
  const bytes1 = encoder.encode(jsonRandomCredential1);
  const e3 = Accumulator.encodeBytesAsAccumulatorMember(bytes1);
  await accumulator.add(e3, sk);

  // verify invalid membership witness
  totalTime = 0;
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    console.log("Result of verify invalid witness: ", accumulator.verifyMembershipWitness(e2, witness, pk, paramsRandom));
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    totalTime += executionTime;
  }

  averageTime = totalTime / iterations;
  appendToConsole("Veryfing invalid membership witness. Average execution time: " + averageTime + " milliseconds");
  
})()
