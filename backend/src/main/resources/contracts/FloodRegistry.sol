// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FloodRegistry {
    
    // The official who deployed the contract
    address public governmentAdmin;

    struct DisasterEvent {
        uint256 eventId;
        string regionName;
        int256 latitude;   // Stored as integer (e.g. lat * 10^6) to avoid float issues
        int256 longitude;
        uint256 dangerLevel;
        uint256 timestamp;
    }

    // Store all events by their ID
    mapping(uint256 => DisasterEvent) public floodEvents;
    uint256 public nextEventId;

    // Emitted to the blockchain logs so off-chain apps can listen for it
    event FloodDeclared(uint256 indexed eventId, string regionName, uint256 dangerLevel, uint256 timestamp);

    constructor() {
        governmentAdmin = msg.sender;
    }

    // Modifier ensuring only the admin can declare a disaster
    modifier onlyAdmin() {
        require(msg.sender == governmentAdmin, "Unauthorized: Only officials can declare floods");
        _;
    }

    // Function to permanently log the disaster
    function logFloodEvent(
        string memory _regionName, 
        int256 _latitude, 
        int256 _longitude, 
        uint256 _dangerLevel
    ) public onlyAdmin {
        
        uint256 currentId = nextEventId++;
        
        floodEvents[currentId] = DisasterEvent({
            eventId: currentId,
            regionName: _regionName,
            latitude: _latitude,
            longitude: _longitude,
            dangerLevel: _dangerLevel,
            timestamp: block.timestamp
        });

        emit FloodDeclared(currentId, _regionName, _dangerLevel, block.timestamp);
    }
    
    // Retrieve the verified immutable record
    function getFloodEvent(uint256 _eventId) public view returns (DisasterEvent memory) {
        return floodEvents[_eventId];
    }
}
