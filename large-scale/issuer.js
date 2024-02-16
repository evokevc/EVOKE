const { 
    initializeWasm, 
    PositiveAccumulator, 
    Accumulator } = require("@docknetwork/crypto-wasm-ts");

class Issuer {
    /**
   * Initialize the issuer.
   * @param newtork   - IoT network
   * @returns - an instance of an issuer
   */
    constructor(network){
        this.issuedVCs   = [];
        this.accumulator = null;
        this.sk          = null;
        this.witnesses   = [];
        this.elements    = []

        for(let i = 0; i < network.length; i++){
            this.issuedVCs[i] = "v";
        }

    }

    /**
   * Generate accumulator.
   * @param   - IoT network
   * @returns - accumulator containing valid VCs, corresponding witnesses, and times needed to perform operations
   */
    async generateAccumulator(network){
        await initializeWasm();
        
        // Randomly generated params
        this.paramsRandom = PositiveAccumulator.generateParams();
      
        // Generating a keypair
        const keypair = PositiveAccumulator.generateKeypair(this.paramsRandom);
        this.sk      = keypair.sk
        this.pk      = keypair.pk
      
        // Initialize the accumulator
        this.accumulator = PositiveAccumulator.initialize(this.paramsRandom);
      
        const encoder = new TextEncoder();  

        for(let i = 0; i < network.length; i++){
            const jsonRandomCredential = JSON.stringify(this.issuedVCs[i])
            const bytes = encoder.encode(jsonRandomCredential);
            this.elements.push(Accumulator.encodeBytesAsAccumulatorMember(bytes));
        }

        const startTimeAcc = performance.now();
        await this.accumulator.addBatch(this.elements, this.sk);
        const endTimeAcc = performance.now();
        const totalTimeAccumulator = endTimeAcc - startTimeAcc;

        const startTimeWit = performance.now();
        this.witnesses = await this.accumulator.membershipWitnessesForBatch(this.elements, this.sk);
        const endTimeWit = performance.now();
        const totalTimeWitnesses = endTimeWit - startTimeWit;

        return [totalTimeAccumulator, totalTimeWitnesses]

    }
    
    /**
   * Revoke VCs.
   * @param number - number of VCs to revoke
   * @param network - IoT network
   * @returns - updated network and valid VCs and the time needed to update accumulator and generate witnesses
   */
    async revokeVCs(network, number){
        let index = 0;
        let tempElements = []
        
        while(index < number){
            let randomIndex = Math.floor(Math.random() * this.elements.length);
            
            if (network[randomIndex].vc == "v"){
                network[randomIndex].vc = "r";
                this.issuedVCs[randomIndex] = "r";
                tempElements.push(this.elements[randomIndex]);
                this.elements.splice(randomIndex, 1);
                index++;
            }
        }

        const start = performance.now();
        await this.accumulator.removeBatch(tempElements, this.sk);
        this.witnesses = await this.accumulator.membershipWitnessesForBatch(this.elements, this.sk);
        const end = performance.now();
        const totalTime = end - start;
        
        for(let i = 0; i < network.length; i++){
            network[i].accumulator = "o";
            network[i].witness = "o"
            }
        
        return totalTime;
    
    }
    

    /**
   * Send updates.
   * @param network - IoT network
   * @returns - the updated network of valid VCs
   */
    sendUpdates(network){
        let updated  = 0;
        let outdated = 0;
        for(let i = 0; i < network.length; i++){
            if(network[i].isMissing != true){
                network[i].accumulator = "u";
                network[i].witness = "u";
                updated++;
            }

            if(network[i].isMissing == true){
                network[i].accumulator = "o";
                network[i].witness = "o";
                outdated++;
            }
        }
        console.log("\n=== Issuer ===\n", updated, "IoT devices have been updated.")
        console.log(outdated, "IoT devices are outdated.")
    }
}

module.exports = Issuer;