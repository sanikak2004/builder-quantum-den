/*
SPDX-License-Identifier: Apache-2.0

eKYC Chaincode for Hyperledger Fabric
This chaincode manages KYC records on the blockchain with immutable audit trails.
*/

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing KYC records
type SmartContract struct {
	contractapi.Contract
}

// KYCRecord represents a KYC record stored on the blockchain
type KYCRecord struct {
	ID                string            `json:"id"`
	UserID            string            `json:"userId"`
	Name              string            `json:"name"`
	Email             string            `json:"email"`
	Phone             string            `json:"phone"`
	PAN               string            `json:"pan"`
	DateOfBirth       string            `json:"dateOfBirth"`
	Address           Address           `json:"address"`
	DocumentHashes    []DocumentHash    `json:"documentHashes"`
	Status            string            `json:"status"` // PENDING, VERIFIED, REJECTED, EXPIRED
	VerificationLevel string            `json:"verificationLevel"` // L1, L2, L3
	CreatedAt         string            `json:"createdAt"`
	UpdatedAt         string            `json:"updatedAt"`
	VerifiedAt        string            `json:"verifiedAt,omitempty"`
	VerifiedBy        string            `json:"verifiedBy,omitempty"`
	Remarks           string            `json:"remarks,omitempty"`
}

// Address represents the address information
type Address struct {
	Street  string `json:"street"`
	City    string `json:"city"`
	State   string `json:"state"`
	Pincode string `json:"pincode"`
	Country string `json:"country"`
}

// DocumentHash represents a document hash stored on blockchain
type DocumentHash struct {
	ID           string `json:"id"`
	Type         string `json:"type"` // PAN, AADHAAR, PASSPORT, etc.
	Hash         string `json:"hash"`
	IPFSHash     string `json:"ipfsHash,omitempty"`
	UploadedAt   string `json:"uploadedAt"`
}

// HistoryEntry represents an audit trail entry
type HistoryEntry struct {
	ID               string                 `json:"id"`
	KYCID            string                 `json:"kycId"`
	Action           string                 `json:"action"` // CREATED, UPDATED, VERIFIED, REJECTED, RESUBMITTED
	PerformedBy      string                 `json:"performedBy"`
	PerformedAt      string                 `json:"performedAt"`
	TxID             string                 `json:"txId"`
	Details          map[string]interface{} `json:"details"`
	Remarks          string                 `json:"remarks,omitempty"`
}

// QueryResult structure used for handling result of query
type QueryResult struct {
	Key    string `json:"Key"`
	Record *KYCRecord
}

// InitLedger adds a base set of KYC records to the ledger
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	log.Println("eKYC Chaincode initialized successfully")
	return nil
}

// CreateKYC creates a new KYC record
func (s *SmartContract) CreateKYC(ctx contractapi.TransactionContextInterface, kycData string) error {
	var kyc KYCRecord
	err := json.Unmarshal([]byte(kycData), &kyc)
	if err != nil {
		return fmt.Errorf("failed to unmarshal KYC data: %v", err)
	}

	// Check if KYC already exists
	exists, err := s.KYCExists(ctx, kyc.ID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("KYC record %s already exists", kyc.ID)
	}

	// Set creation timestamp
	kyc.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	kyc.UpdatedAt = kyc.CreatedAt
	kyc.Status = "PENDING"
	
	if kyc.VerificationLevel == "" {
		kyc.VerificationLevel = "L1"
	}

	kycJSON, err := json.Marshal(kyc)
	if err != nil {
		return err
	}

	// Store KYC record
	err = ctx.GetStub().PutState(kyc.ID, kycJSON)
	if err != nil {
		return fmt.Errorf("failed to put KYC record: %v", err)
	}

	// Create history entry
	txID := ctx.GetStub().GetTxID()
	historyEntry := HistoryEntry{
		ID:          fmt.Sprintf("%s-CREATED-%d", kyc.ID, time.Now().Unix()),
		KYCID:       kyc.ID,
		Action:      "CREATED",
		PerformedBy: kyc.UserID,
		PerformedAt: kyc.CreatedAt,
		TxID:        txID,
		Details: map[string]interface{}{
			"initialSubmission": true,
			"documentCount":     len(kyc.DocumentHashes),
		},
		Remarks: "Initial KYC submission",
	}

	err = s.createHistoryEntry(ctx, historyEntry)
	if err != nil {
		return fmt.Errorf("failed to create history entry: %v", err)
	}

	return nil
}

// ReadKYC returns the KYC record stored in the world state with given id
func (s *SmartContract) ReadKYC(ctx contractapi.TransactionContextInterface, id string) (*KYCRecord, error) {
	kycJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if kycJSON == nil {
		return nil, fmt.Errorf("KYC record %s does not exist", id)
	}

	var kyc KYCRecord
	err = json.Unmarshal(kycJSON, &kyc)
	if err != nil {
		return nil, err
	}

	return &kyc, nil
}

// UpdateKYCStatus updates the status of an existing KYC record
func (s *SmartContract) UpdateKYCStatus(ctx contractapi.TransactionContextInterface, id string, status string, verifiedBy string, remarks string) error {
	kyc, err := s.ReadKYC(ctx, id)
	if err != nil {
		return err
	}

	oldStatus := kyc.Status
	kyc.Status = status
	kyc.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	kyc.Remarks = remarks

	if status == "VERIFIED" {
		kyc.VerifiedAt = kyc.UpdatedAt
		kyc.VerifiedBy = verifiedBy
		kyc.VerificationLevel = "L2" // Upgrade verification level
	}

	kycJSON, err := json.Marshal(kyc)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(id, kycJSON)
	if err != nil {
		return fmt.Errorf("failed to update KYC record: %v", err)
	}

	// Create history entry
	txID := ctx.GetStub().GetTxID()
	action := "UPDATED"
	if status == "VERIFIED" {
		action = "VERIFIED"
	} else if status == "REJECTED" {
		action = "REJECTED"
	}

	historyEntry := HistoryEntry{
		ID:          fmt.Sprintf("%s-%s-%d", id, action, time.Now().Unix()),
		KYCID:       id,
		Action:      action,
		PerformedBy: verifiedBy,
		PerformedAt: kyc.UpdatedAt,
		TxID:        txID,
		Details: map[string]interface{}{
			"oldStatus":         oldStatus,
			"newStatus":         status,
			"verificationLevel": kyc.VerificationLevel,
		},
		Remarks: remarks,
	}

	err = s.createHistoryEntry(ctx, historyEntry)
	if err != nil {
		return fmt.Errorf("failed to create history entry: %v", err)
	}

	return nil
}

// DeleteKYC deletes a KYC record from the world state
func (s *SmartContract) DeleteKYC(ctx contractapi.TransactionContextInterface, id string) error {
	exists, err := s.KYCExists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("KYC record %s does not exist", id)
	}

	return ctx.GetStub().DelState(id)
}

// KYCExists returns true when KYC with given ID exists in world state
func (s *SmartContract) KYCExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	kycJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return kycJSON != nil, nil
}

// GetKYCByPAN queries for KYC records by PAN number
func (s *SmartContract) GetKYCByPAN(ctx contractapi.TransactionContextInterface, pan string) ([]*KYCRecord, error) {
	queryString := fmt.Sprintf(`{"selector":{"pan":"%s"}}`, pan)
	return s.getQueryResultForQueryString(ctx, queryString)
}

// GetKYCByEmail queries for KYC records by email
func (s *SmartContract) GetKYCByEmail(ctx contractapi.TransactionContextInterface, email string) ([]*KYCRecord, error) {
	queryString := fmt.Sprintf(`{"selector":{"email":"%s"}}`, email)
	return s.getQueryResultForQueryString(ctx, queryString)
}

// GetKYCByStatus queries for KYC records by status
func (s *SmartContract) GetKYCByStatus(ctx contractapi.TransactionContextInterface, status string) ([]*KYCRecord, error) {
	queryString := fmt.Sprintf(`{"selector":{"status":"%s"}}`, status)
	return s.getQueryResultForQueryString(ctx, queryString)
}

// GetKYCHistory returns the history of a specific KYC record
func (s *SmartContract) GetKYCHistory(ctx contractapi.TransactionContextInterface, kycID string) ([]*HistoryEntry, error) {
	queryString := fmt.Sprintf(`{"selector":{"kycId":"%s"}}`, kycID)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var history []*HistoryEntry
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var historyEntry HistoryEntry
		err = json.Unmarshal(queryResponse.Value, &historyEntry)
		if err != nil {
			return nil, err
		}
		history = append(history, &historyEntry)
	}

	return history, nil
}

// GetAllKYC returns all KYC records found in world state
func (s *SmartContract) GetAllKYC(ctx contractapi.TransactionContextInterface) ([]*KYCRecord, error) {
	// range query with empty string for startKey and endKey does an
	// open-ended query of all KYC records in the chaincode namespace.
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var kycRecords []*KYCRecord
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var kyc KYCRecord
		err = json.Unmarshal(queryResponse.Value, &kyc)
		if err != nil {
			return nil, err
		}
		kycRecords = append(kycRecords, &kyc)
	}

	return kycRecords, nil
}

// VerifyDocumentHash verifies if a document hash exists in a KYC record
func (s *SmartContract) VerifyDocumentHash(ctx contractapi.TransactionContextInterface, kycID string, documentHash string) (bool, error) {
	kyc, err := s.ReadKYC(ctx, kycID)
	if err != nil {
		return false, err
	}

	for _, docHash := range kyc.DocumentHashes {
		if docHash.Hash == documentHash {
			return true, nil
		}
	}

	return false, nil
}

// Helper function to create history entries
func (s *SmartContract) createHistoryEntry(ctx contractapi.TransactionContextInterface, entry HistoryEntry) error {
	historyJSON, err := json.Marshal(entry)
	if err != nil {
		return err
	}

	historyKey := fmt.Sprintf("HISTORY_%s", entry.ID)
	return ctx.GetStub().PutState(historyKey, historyJSON)
}

// Helper function for queries
func (s *SmartContract) getQueryResultForQueryString(ctx contractapi.TransactionContextInterface, queryString string) ([]*KYCRecord, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var kycRecords []*KYCRecord
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var kyc KYCRecord
		err = json.Unmarshal(queryResponse.Value, &kyc)
		if err != nil {
			return nil, err
		}
		kycRecords = append(kycRecords, &kyc)
	}

	return kycRecords, nil
}

func main() {
	kycChaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Error creating eKYC chaincode: %v", err)
	}

	if err := kycChaincode.Start(); err != nil {
		log.Panicf("Error starting eKYC chaincode: %v", err)
	}
}
