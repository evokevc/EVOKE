class Device {
    /**
   * Initialize a device.
   * @param type - IoT device can be normal "n" or constrained "c"
   * @param isMissing - True if it misses updates, false otherwise
   * @param accumulator - accumulator, it can be updated "u" or outdated "o"
   * @param witness - witness, it can be updated "u" or outdated "o"
   * @param vc - vc can be valid "v" or revoked "r"
   * @param interactionsHour - interactions per hour
   * @param interactions - total number of interactions
   * @returns - an instance of an IoT device
   */
    constructor(type, isMissing, accumulator, witness, vc){
        this.type             = type;
        this.isMissing        = isMissing;
        this.accumulator      = accumulator; 
        this.witness          = witness; 
        this.vc               = vc;
        this.interactionsHour = 0;
        this.interactions     = 0;
    }

    /**
   * Reset interactions per hour.
   * @returns - IoT device with interactions set to 0
   */
    resetInteractions(){
        this.interactionsHour = 0;
    }
}

module.exports = Device;