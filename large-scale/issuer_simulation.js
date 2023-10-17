const Issuer = require('./issuer');
const Network = require('./network');
const Utils   = require('./utils')

// Experiments settings
const numberOfDevices           = [10000, 50000, 500000, 1000000]; 
const numeberOfRevocations      = [10, 25, 50]; // percentage
const numberOfExecutions        = 1000;

// Simulate issuer overhead
async function main(){
    
    for(let d = 0; d < numberOfDevices.length; d++){
        let issuerResult         = {};
        for(let r = 0; r < numeberOfRevocations.length; r++){
            let totalTimeAccumulator = 0;
            let totalTimeWitnesses   = 0
            let totalTimeRevocation  = 0;
            
            const network = new Network(numberOfDevices[d], 0);
            const issuer  = new Issuer(network.network);
            const numberOfRevoc = (numberOfDevices[d] * numeberOfRevocations[r])/100;

            for(let execution = 0; execution < numberOfExecutions; execution++){
                
                const [executionTimeAccumulator, executionTimeWitnesses] = await issuer.generateAccumulator(network.network);
                const executionRevocation = await issuer.revokeVCs(network.network, numberOfRevoc);

                totalTimeAccumulator += executionTimeAccumulator;
                totalTimeWitnesses   += executionTimeWitnesses;
                totalTimeRevocation  += executionRevocation;
            }

            issuerResult = {
                devices: numberOfDevices[d],
                accumulatorGenerationOverhead: totalTimeAccumulator/numberOfExecutions,
                witnessesGenerationOverhead: totalTimeWitnesses/numberOfExecutions,
                numeberOfRevocations: numberOfRevoc,
                revocationsGeneralOverhead: totalTimeRevocation/numberOfExecutions
            }

            Utils.writeToFile("./results/issuer_overhead_revocations_" + numeberOfRevocations[r] +".csv", issuerResult)
        }

        Utils.writeToFile("./results/issuer_overhead.csv", issuerResult)
    }
}

main();