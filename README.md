# EVOKE
## Efficient revocation of verifiable credentials in IoT environments

EVOKE is a project that aims to address the challenges of revoking verifiable credentials in IoT environments. It utilizes an ECC-based accumulator to efficiently manage verifiable credentials while minimizing the computational and storage overhead. EVOKE also offers additional essential features such as *mass revocation* and *offline revocation*.

### Repository Structure
The EVOKE repository is organized into three main directories, each containing a set of experiments to evaluate EVOKE under different scenarios:

* **commodity**: This directory includes experiments conducted on commodity IoT devices that support a browser connection. These experiments aim to assess the performance and effectiveness of EVOKE in a real-world, commercially available IoT environment.
* **hybrid_networks**: The hybrid directory contains experiments that evaluate EVOKE in hybrid network settings. These experiments explore the applicability of EVOKE in environments where a combination of different IoT technologies and network configurations are present.
* **large-scale**: The simulation directory consists of experiments conducted in a large-scale deployment with thousands of devices. These experiments provide insights into the scalability and efficiency of EVOKE when deployed in IoT environments with a significant number of devices.

