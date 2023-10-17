const fs = require('fs')

// Append to a csv file
function writeToFile(filename, objectData) {
    const serializedData = Object.values(objectData).join(',');
  
    // Check if the file already exists
    const fileExists = fs.existsSync(filename);
  
    // Append object data to the file
    if (fileExists) {
      fs.appendFileSync(filename, serializedData + '\n');
    } else {
      const headers = Object.keys(objectData).join(',') + '\n';
      fs.appendFileSync(filename, headers + serializedData + '\n');
    }
  }
  

// Average the results 
function getAverages(results, numberOfExecutions){
    let averageAccumulatorOverhead = 0;
    let averageWitnessesOverhead   = 0;
    let averageTotalOverhead       = 0;
    let averageUpdatedDevices      = 0;

    for(let i = 0; i < results.length; i++){
        averageAccumulatorOverhead += results[i].accumulatorOverhead;
        averageWitnessesOverhead   += results[i].witnessesOverhead;
        averageTotalOverhead       += results[i].totalOverhead;
        averageUpdatedDevices      += results[i].updatedDevices;
    }

    return {
        devices: results[0].devices,
        avgAccOverhead: averageAccumulatorOverhead/numberOfExecutions,
        avgWitOverhead: averageWitnessesOverhead/numberOfExecutions,
        avgUpdatedDevices: averageUpdatedDevices/numberOfExecutions,
        totAvgOverhead: averageAccumulatorOverhead/numberOfExecutions + averageWitnessesOverhead/numberOfExecutions
    }
}

module.exports = {
    writeToFile,
    getAverages
}