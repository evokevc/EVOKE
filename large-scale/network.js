const Device = require('./device');
const Issuer = require('./issuer')

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
        let i = 0;
        for(; i < missing; i++){
            const randomType = types[Math.floor(Math.random() * types.length)];
            const device = new Device(i, randomType, true, "u", "u", "v");
            this.network.push(device);
        }    
        
        // Initialize other devices
        for(; i < devices; i++){
            const device = new Device(i, "n", false, "u", "u", "v");
            this.network.push(device);
        }
        
        this.network = this.shuffleNetwork(this.network)
        this.issuer = new Issuer(this.network)
    
    }

     /**
   * Shuffle the devices in the network.
   * @returns - Shuffled network
   */
    shuffleNetwork(network) {

        let currentIndex = network.length;
        let randomIndex;
     
        while (currentIndex > 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
     
            // Swap elements
            [network[currentIndex], network[randomIndex]] = [network[randomIndex], network[currentIndex]];
        }
        
        return network
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
            this.issuer.sendUpdates(this.network)

            for(let i = 0; i < interactionsPerDay; i = i + interactionsPerHour) {
                this.resetInteractionsDevices();
                
                let count = 0;
                while(true) {
                    
                    let d1 = null;
                    for (const device of this.network) {
                        if (device.interactionsHour < interactionsPerHour) {
                            d1 = device;
                            break;                           
                        }
                    }

                    if (d1 === null) {
                        break;
                    }
                   
                    d1.n_selection++;
                    
                    let d2 = this.getOtherDevice(d1, interactionsPerHour);
                    if (d2 === null) {
                        break;
                    }

                    d2.n_selection++;

                    d1.interactionsHour++;
                    d1.interactions++;
                    d2.interactionsHour++;
                    d2.interactions++;

                    // both diveces are updated
                    let skipNextControl = 0
                    if(d1.accumulator == "u" && d1.witness == "u" && 
                       d2.accumulator == "u" && d2.witness == "u")
                    {
                        skipNextControl = 1;
                    }
                    
                    // only one of the device is updated
                    if(skipNextControl != 1 && ((d1.accumulator == "u") != (d2.accumulator == "u"))){
                        d1.accumulator = "u";
                        d2.accumulator = "u"; 
                        this.nAcc++;

                        // constrained devices can only update the accumulator
                        if(d1.type == "n" || d2.type == "n"){
                            updatedDevices++;
                            d1.witness = "u";
                            d2.witness = "u";
                            this.nWit++;
                        }
                    }    
                    
                    // Simulate random interactions between devices
                    this.network = this.shuffleNetwork(this.network)
                    count++;
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
            if(this.network[i].accumulator == "o" || this.network[i].witness == "o"){
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
   * Get a valid device. 
   * @param index - different from the random index
   * @param interactionsPerHour - maximum number of interactions per hour
   * @param network - IoT network
   * @returns - valid random index
   */
    getOtherDevice(device, interactionsPerHour) {
        for (let d of this.network) {
            if (d != device && d.interactionsHour < interactionsPerHour) 
                return d;
        }

        return null;
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
        
        // each interactions involve two devices
        return interactions / 2;
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