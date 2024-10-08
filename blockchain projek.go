package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

var upgrader = websocket.Upgrader{} // WebSocket upgrader
var clients = make(map[*websocket.Conn]bool)
var broadcast = make(chan interface{})
var mutex = &sync.Mutex{}

type SmartContract struct {
	contractapi.Contract
}

type Student struct {
	Name   string `json:"name"`
	School string `json:"school"`
	Status string `json:"status"`
}

type Transaction struct {
	ID         string `json:"id"`
	Action     string `json:"action"`
	StudentID  string `json:"student_id"`
	Timestamp  string `json:"timestamp"`
}

// Fungsi untuk registrasi siswa
func (s *SmartContract) RegisterStudent(ctx contractapi.TransactionContextInterface, id string, name string, school string) error {
	student := Student{
		Name:   name,
		School: school,
		Status: "Registered",
	}

	studentAsBytes, err := json.Marshal(student)
	if err != nil {
		return fmt.Errorf("gagal melakukan serialisasi data mahasiswa: %v", err)
	}

	err = ctx.GetStub().PutState(id, studentAsBytes)
	if err != nil {
		return fmt.Errorf("gagal menyimpan data siswa dengan ID %s: %v", id, err)
	}

	// Tambahkan transaksi ke audit log
	transaction := Transaction{
		ID:        "tx_" + id,
		Action:    "Register",
		StudentID: id,
		Timestamp: ctx.GetStub().GetTxTimestamp().String(),
	}
	logTransaction(transaction)

	// Kirim notifikasi melalui WebSocket
	broadcast <- transaction

	return nil
}

// Fungsi untuk query siswa
func (s *SmartContract) QueryStudent(ctx contractapi.TransactionContextInterface, id string) (*Student, error) {
	studentAsBytes, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil data mahasiswa dengan ID %s: %v", id, err)
	}

	if studentAsBytes == nil {
		return nil, fmt.Errorf("mahasiswa dengan ID %s tidak ditemukan", id)
	}

	student := new(Student)
	err = json.Unmarshal(studentAsBytes, student)
	if err != nil {
		return nil, fmt.Errorf("gagal melakukan deserialisasi data mahasiswa dengan ID %s: %v", id, err)
	}

	return student, nil
}

// Fungsi untuk audit log
func logTransaction(transaction Transaction) {
	// Simpan log transaksi di blockchain atau database eksternal
	fmt.Printf("Transaction Logged: %+v\n", transaction)
}

// WebSocket handler
func handleConnections(w http.ResponseWriter, r *http.Request) {
	// Upgrade HTTP ke WebSocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer ws.Close()

	mutex.Lock()
	clients[ws] = true
	mutex.Unlock()

	// Kirim update real-time jika ada data baru
	for {
		message, ok := <-broadcast
		if !ok {
			return
		}
		for client := range clients {
			err := client.WriteJSON(message)
			if err != nil {
				log.Printf("error: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}

// Rest API handler untuk verifikasi siswa berdasarkan status
func verifyStudentsHandler(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	if status == "" {
		http.Error(w, "Status query parameter required", http.StatusBadRequest)
		return
	}

	// Ambil daftar siswa berdasarkan status (hanya contoh, ambil dari ledger)
	// Misalnya: Semua siswa dengan status "Registered"
	verifiedStudents := []Student{
		{Name: "Alice", School: "School A", Status: "Registered"},
		{Name: "Bob", School: "School B", Status: "Registered"},
	}

	json.NewEncoder(w).Encode(verifiedStudents)
}

func main() {
	router := mux.NewRouter()

	// Route untuk API
	router.HandleFunc("/api/register-student", registerStudentHandler).Methods("POST")
	router.HandleFunc("/api/query-student/{id}", queryStudentHandler).Methods("GET")
	router.HandleFunc("/api/verify-students", verifyStudentsHandler).Methods("GET")

	// WebSocket route
	router.HandleFunc("/ws", handleConnections)

	// Mulai server HTTP
	go func() {
		log.Fatal(http.ListenAndServe(":8000", router))
	}()

	// Kirimkan pesan broadcast ketika ada perubahan
	for {
		msg := <-broadcast
		for client := range clients {
			err := client.WriteJSON(msg)
			if err != nil {
				log.Printf("error: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}