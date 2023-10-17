const Device = require('./device');
const Issuer = require('./issuer'
)
class Network {
    /**
   * Initialize a network.
   * @param issuer  - issuer of VCs
   * @param devices - number of devices
   * @param missing - number of devices missing updates
   * @param network - network of devices
   * @param nAcc    - number of accumulator exchanged
   * @param nWit    - number of witness exchange
   * @returns - an IoT network
   */
    constructor(devices, missing){
        const types  = ["n", "c"];
        this.network = []
        this.nAcc    = 0;
        this.nWit    = 0;

        // Initialize devices missing updates
        for(let i = 0; i < missing; i++){
            const randomType = types[Math.floor(Math.random() * types.length)];
            const device = new Device(randomType, true, "u", "u", "v");
            this.network.push(device);
        }    
        
        // Initialize other devices
        for(let i = 0; i < devices - missing; i++){
            const device = new Device("n", false, "u", "u", "v");
            this.network.push(device);
        }
        
        this.shuffleNetwork()
        this.issuer = new Issuer(this.network)
    
    }

     /**
   * Shuffle the devices in the network.
   * @returns - Shuffled network
   */
    shuffleNetwork() {
        for (let i = this.network.length - 1; i > 0; i--) {
          const randomIndex = Math.floor(Math.random() * (i + 1));
          [this.network[i], this.network[randomIndex]] = [this.network[randomIndex], this.network[i]];
        }
      }

     /**
   * Simulate interactions among devices.
   * @param interactionsPerHour - number of interactions per hour per device
   * @param interactionsPerDay - number of interactions per day per device
   * @param numberOfDays - number of simulation days
   * @param numberOfVCsToRevokePerDay - number of VCs to revoke per day
   * @returns - Updated network
   */
    async simulateInteractions(interactionsPerHour, interactionsPerDay, numberOfDays, numberOfVCsToRevokePerDay){
        let updatedDevices = 0;
        for(let d = 0; d < numberOfDays; d++){

            // Revoke VCs
            await this.issuer.generateAccumulator(this.network)
            await this.issuer.revokeVCs(this.network, numberOfVCsToRevokePerDay);
            console.log("Is the whole network outdated?", this.isOutdated())

            // Update the network
            this.issuer.sendUpdates(this.network);
            for(let i = 0; i < interactionsPerDay; i = i + interactionsPerHour){
                this.resetInteractionsDevices();
                this.shuffleNetwork();

                for(let j = 0; j < this.network.length; j++){

                    // Simulate random interactions between devices
                    this.shuffleNetwork();
                
                    while(this.network[j].interactionsHour < interactionsPerHour){
                        
                        let randomIndex = this.getValidRandomIndex(j, interactionsPerHour);
                        this.network[j].interactionsHour++;
                        this.network[j].interactions++;
                        this.network[randomIndex].interactionsHour++;
                        this.network[randomIndex].interactions++;
                    
                        // both diveces are updated
                        let skipNextControl = 0
                        if(this.network[j].accumulator == "u" && this.network[randomIndex].accumulator == "u"){
                            skipNextControl = 1;
                        }
                        
                        // only one of the device is updated
                        if(skipNextControl != 1 && (this.network[j].accumulator == "u" || this.network[randomIndex].accumulator == "u")){
                            updatedDevices++;
                            this.network[j].accumulator = "u";
                            this.network[randomIndex].accumulator = "u"; 
                            this.nAcc++;

                            // constrained devices can only update the accumulator
                            if(this.network[j].type == "n" || this.network[randomIndex].accumulator == "n"){
                                this.network[j].witness = "u";
                                this.network[randomIndex].witness = "u";
                                this.nWit++;
                            }
                        }
                    }             
                }
            }

        }
        console.log("\n=== Network ===\n\nAfter the interactions, ", updatedDevices, "IoT devices have been updated.")
        console.log("Is the whole network updated?", this.isUpdated())
        return [this.nAcc, this.nWit, updatedDevices];
    }

    /**
   * Verify if the network is updated
   * @returns - True if the network is updated, false otherwise
   */
    isUpdated(){
        let i = 0;
        while(i < this.network.length){
            if(this.network[i].accumulator == "o" && this.network[i].witness == "o"){
                return false;
            }
            i++;
        }
        return true;
    }

    /**
   * Verify that all network is outadated
   * @returns - True if the all network is outdated, false otherwise
   */
    isOutdated(){
        let i = 0;
    
        while(i < this.network.length){
            
            if(this.network[i].accumulator == "u" && this.network[i].witness == "u"){
                return false;
            }
            i++;
        }
        
        return true;
    }
    
    /**
   * Reset the number of interactions per hour of IoT devices. 
   * @returns - network with IoT devices interactions per hour set to 0
   */
    resetInteractionsDevices() {
        for(let i = 0; i < this.network.length; i++){
            this.network[i].resetInteractions();
        }
    }

    /**
   * Get a valid random index. 
   * @param index - different from the random index
   * @param interactionsPerHour - maximum number of interactions per hour
   * @returns - valid random index
   */
    getValidRandomIndex(index, interactionsPerHour) {
        let valid = false;

        while(!valid){
            for(let j = this.network.length - 1 ; j >= 0; j--){
            if((j != index) && (this.network[j].interactionsHour != interactionsPerHour)){
                    valid = true;
                    return j;
                } 
            }
        }
    }

    /**
   * Get the number of interactions within the network. 
   * @returns - iteractions
   */
    getInteractions() {
        let interactions = 0;
        for(let i = 0; i < this.network.length; i++){
            interactions += this.network[i].interactions;
        }

        return interactions;
    }

    /**
   * Get number of devices in the network. 
   * @returns - number of IoT devices in the network
   */
    get length() {
        return this.network.length;
      }
}

module.exports = Network;