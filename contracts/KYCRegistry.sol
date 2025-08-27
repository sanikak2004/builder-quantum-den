// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title KYCRegistry
 * @dev Smart contract for managing KYC records on blockchain
 * @author Authen Ledger Team
 */
contract KYCRegistry {
    // Events
    event KYCSubmitted(
        bytes32 indexed kycId,
        address indexed user,
        string documentHash,
        uint256 timestamp
    );
    
    event KYCStatusUpdated(
        bytes32 indexed kycId,
        KYCStatus newStatus,
        address indexed verifier,
        uint256 timestamp
    );
    
    event DocumentUpdated(
        bytes32 indexed kycId,
        string newDocumentHash,
        uint256 version,
        uint256 timestamp
    );
    
    event AccessGranted(
        bytes32 indexed kycId,
        address indexed organization,
        uint256 expiryTime,
        uint256 timestamp
    );

    // Enums
    enum KYCStatus { PENDING, VERIFIED, REJECTED, EXPIRED }
    enum VerificationLevel { L1, L2, L3 }

    // Structs
    struct KYCRecord {
        bytes32 kycId;
        address userAddress;
        string documentHash;
        string ipfsHash;
        KYCStatus status;
        VerificationLevel level;
        address verifiedBy;
        uint256 submittedAt;
        uint256 verifiedAt;
        uint256 version;
        bool exists;
    }

    struct AccessToken {
        address organization;
        bytes32 kycId;
        uint256 expiryTime;
        bool isActive;
        uint256 usageCount;
    }

    // State variables
    mapping(bytes32 => KYCRecord) public kycRecords;
    mapping(address => bytes32[]) public userKYCRecords;
    mapping(bytes32 => AccessToken[]) public accessTokens;
    mapping(address => bool) public authorizedVerifiers;
    mapping(address => bool) public authorizedOrganizations;
    
    address public owner;
    uint256 public totalKYCRecords;
    uint256 public totalVerifiedRecords;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyVerifier() {
        require(
            authorizedVerifiers[msg.sender] || msg.sender == owner,
            "Only authorized verifiers can perform this action"
        );
        _;
    }
    
    modifier onlyAuthorizedOrg() {
        require(
            authorizedOrganizations[msg.sender] || msg.sender == owner,
            "Only authorized organizations can perform this action"
        );
        _;
    }
    
    modifier kycExists(bytes32 _kycId) {
        require(kycRecords[_kycId].exists, "KYC record does not exist");
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
        authorizedVerifiers[msg.sender] = true;
    }

    /**
     * @dev Submit new KYC record
     * @param _kycId Unique identifier for KYC record
     * @param _documentHash Hash of KYC documents
     * @param _ipfsHash IPFS hash for document storage
     */
    function submitKYC(
        bytes32 _kycId,
        string memory _documentHash,
        string memory _ipfsHash
    ) external {
        require(!kycRecords[_kycId].exists, "KYC record already exists");
        require(bytes(_documentHash).length > 0, "Document hash cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");

        KYCRecord memory newRecord = KYCRecord({
            kycId: _kycId,
            userAddress: msg.sender,
            documentHash: _documentHash,
            ipfsHash: _ipfsHash,
            status: KYCStatus.PENDING,
            level: VerificationLevel.L1,
            verifiedBy: address(0),
            submittedAt: block.timestamp,
            verifiedAt: 0,
            version: 1,
            exists: true
        });

        kycRecords[_kycId] = newRecord;
        userKYCRecords[msg.sender].push(_kycId);
        totalKYCRecords++;

        emit KYCSubmitted(_kycId, msg.sender, _documentHash, block.timestamp);
    }

    /**
     * @dev Update KYC status (only authorized verifiers)
     * @param _kycId KYC record identifier
     * @param _status New status
     * @param _level Verification level
     */
    function updateKYCStatus(
        bytes32 _kycId,
        KYCStatus _status,
        VerificationLevel _level
    ) external onlyVerifier kycExists(_kycId) {
        KYCRecord storage record = kycRecords[_kycId];
        
        record.status = _status;
        record.level = _level;
        record.verifiedBy = msg.sender;
        record.verifiedAt = block.timestamp;

        if (_status == KYCStatus.VERIFIED) {
            totalVerifiedRecords++;
        }

        emit KYCStatusUpdated(_kycId, _status, msg.sender, block.timestamp);
    }

    /**
     * @dev Update KYC documents (user only)
     * @param _kycId KYC record identifier
     * @param _newDocumentHash New document hash
     * @param _newIpfsHash New IPFS hash
     */
    function updateDocuments(
        bytes32 _kycId,
        string memory _newDocumentHash,
        string memory _newIpfsHash
    ) external kycExists(_kycId) {
        KYCRecord storage record = kycRecords[_kycId];
        require(record.userAddress == msg.sender, "Only record owner can update");
        require(bytes(_newDocumentHash).length > 0, "Document hash cannot be empty");
        require(bytes(_newIpfsHash).length > 0, "IPFS hash cannot be empty");

        record.documentHash = _newDocumentHash;
        record.ipfsHash = _newIpfsHash;
        record.version++;
        record.status = KYCStatus.PENDING; // Reset to pending after update

        emit DocumentUpdated(_kycId, _newDocumentHash, record.version, block.timestamp);
    }

    /**
     * @dev Grant access to organization
     * @param _kycId KYC record identifier
     * @param _organization Organization address
     * @param _expiryTime Access expiry timestamp
     */
    function grantAccess(
        bytes32 _kycId,
        address _organization,
        uint256 _expiryTime
    ) external kycExists(_kycId) {
        KYCRecord storage record = kycRecords[_kycId];
        require(record.userAddress == msg.sender, "Only record owner can grant access");
        require(_organization != address(0), "Invalid organization address");
        require(_expiryTime > block.timestamp, "Expiry time must be in future");

        AccessToken memory newToken = AccessToken({
            organization: _organization,
            kycId: _kycId,
            expiryTime: _expiryTime,
            isActive: true,
            usageCount: 0
        });

        accessTokens[_kycId].push(newToken);

        emit AccessGranted(_kycId, _organization, _expiryTime, block.timestamp);
    }

    /**
     * @dev Verify KYC record (for organizations)
     * @param _kycId KYC record identifier
     * @return Record details if authorized
     */
    function verifyKYC(bytes32 _kycId) 
        external 
        view 
        onlyAuthorizedOrg 
        kycExists(_kycId) 
        returns (
            address userAddress,
            KYCStatus status,
            VerificationLevel level,
            uint256 verifiedAt,
            string memory documentHash
        ) 
    {
        KYCRecord memory record = kycRecords[_kycId];
        
        // Check if organization has valid access
        bool hasAccess = false;
        AccessToken[] memory tokens = accessTokens[_kycId];
        
        for (uint i = 0; i < tokens.length; i++) {
            if (tokens[i].organization == msg.sender && 
                tokens[i].isActive && 
                tokens[i].expiryTime > block.timestamp) {
                hasAccess = true;
                break;
            }
        }
        
        require(hasAccess, "No valid access token");

        return (
            record.userAddress,
            record.status,
            record.level,
            record.verifiedAt,
            record.documentHash
        );
    }

    /**
     * @dev Get KYC record details (public view)
     * @param _kycId KYC record identifier
     */
    function getKYCRecord(bytes32 _kycId) 
        external 
        view 
        kycExists(_kycId) 
        returns (
            address userAddress,
            KYCStatus status,
            VerificationLevel level,
            uint256 submittedAt,
            uint256 verifiedAt,
            uint256 version
        ) 
    {
        KYCRecord memory record = kycRecords[_kycId];
        
        return (
            record.userAddress,
            record.status,
            record.level,
            record.submittedAt,
            record.verifiedAt,
            record.version
        );
    }

    /**
     * @dev Get user's KYC records
     * @param _user User address
     */
    function getUserKYCRecords(address _user) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return userKYCRecords[_user];
    }

    /**
     * @dev Add authorized verifier (only owner)
     * @param _verifier Verifier address
     */
    function addVerifier(address _verifier) external onlyOwner {
        authorizedVerifiers[_verifier] = true;
    }

    /**
     * @dev Remove authorized verifier (only owner)
     * @param _verifier Verifier address
     */
    function removeVerifier(address _verifier) external onlyOwner {
        authorizedVerifiers[_verifier] = false;
    }

    /**
     * @dev Add authorized organization (only owner)
     * @param _organization Organization address
     */
    function addOrganization(address _organization) external onlyOwner {
        authorizedOrganizations[_organization] = true;
    }

    /**
     * @dev Remove authorized organization (only owner)
     * @param _organization Organization address
     */
    function removeOrganization(address _organization) external onlyOwner {
        authorizedOrganizations[_organization] = false;
    }

    /**
     * @dev Check if user is Indian citizen (placeholder for govt API integration)
     * @param _kycId KYC record identifier
     */
    function checkCitizenshipStatus(bytes32 _kycId) 
        external 
        view 
        kycExists(_kycId) 
        returns (bool isIndianCitizen, uint256 lastUpdated) 
    {
        KYCRecord memory record = kycRecords[_kycId];
        
        // In real implementation, this would integrate with govt APIs
        // For now, we return verified status as citizenship indicator
        return (
            record.status == KYCStatus.VERIFIED && record.level >= VerificationLevel.L2,
            record.verifiedAt
        );
    }

    /**
     * @dev Emergency pause functionality (only owner)
     */
    bool public paused = false;
    
    function pause() external onlyOwner {
        paused = true;
    }
    
    function unpause() external onlyOwner {
        paused = false;
    }
    
    modifier notPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    /**
     * @dev Get contract statistics
     */
    function getStats() 
        external 
        view 
        returns (
            uint256 total,
            uint256 verified,
            uint256 pending,
            uint256 rejected
        ) 
    {
        // Note: This is a simplified implementation
        // In production, you might want to maintain these counters more efficiently
        return (totalKYCRecords, totalVerifiedRecords, 0, 0);
    }
}
