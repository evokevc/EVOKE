const Issuer = require('./issuer');
const Network = require('./network');
const Utils   = require('./utils')

// Experiments settings
const interactionPerHour        = 5;
const interactionsPerDay        = 120 * interactionPerHour;
const numberOfDays              = 1
const numberOfDevices           = [10000, 50000, 500000, 1000000]; 
const devicesMissingUpdates     = [10, 30, 50]; // percentage
const numberOfVCsToRevokePerDay = 0.028;  //percentage
const numberOfExecutions        = 1000;
const sizeInBytesSignedVC       = 750;

async function main(){
    
    // Simulation
    for(let d = 0; d < numberOfDevices.length; d++){
            for(let m = 0; m < devicesMissingUpdates.length; m++){
                let simulationResults = [];
                const devicesMissing = (numberOfDevices[d] * devicesMissingUpdates[m])/100; 
                const revocationPerDay = Math.ceil(numberOfDevices[d] * numberOfVCsToRevokePerDay / 100);
                for(let execution = 0; execution < numberOfExecutions; execution++){
                    
                    const network = new Network(numberOfDevices[d], devicesMissing);
                    const [numberOfAccumlators, numberOfWitnesses, updatedDevices] = await network.simulateInteractions(interactionPerHour, interactionsPerDay, numberOfDays, revocationPerDay);
                    console.log("\n=== Simulation Results ===\n\nAccumulator overhead: ", numberOfAccumlators * 800, "bytes");
                    console.log("Witnesses overhead: ", numberOfWitnesses * sizeInBytesSignedVC, "bytes");
                    console.log("Interactions: ", network.getInteractions());

                    const simulationResult = {
                        devices: numberOfDevices[d],
                        accumulatorOverhead: numberOfAccumlators * sizeInBytesSignedVC,
                        witnessesOverhead: numberOfWitnesses * sizeInBytesSignedVC,
                        updatedDevices: updatedDevices,
                        totalOverhead: (numberOfAccumlators + numberOfWitnesses) * sizeInBytesSignedVC
                    }

                    simulationResults.push(simulationResult);
            }
          
            simulationResults.updatedDevices = (simulationResults.updatedDevices + numberOfDevices[d] - devicesMissing)*100/numberOfDevices[d];
            let results = Utils.getAverages(simulationResults, numberOfExecutions);

            results.avgUpdatedDevices = (results.avgUpdatedDevices + numberOfDevices[d] - devicesMissing) * 100 / numberOfDevices[d];
            results["missing"] = devicesMissing;
            results["revocationPerDay"] = revocationPerDay;
            Utils.writeToFile("./results/network_simulation.csv", results);
            
        }
    }
}

main();