package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

// This is a handler function. It handles all incoming web requests to "/".
func handler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello, World! Your Go server is running.")
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		// Handle file upload with 10GB limit
		err := r.ParseMultipartForm(10 << 30) // 10 GB limit
		if err != nil {
			http.Error(w, "Unable to parse form", http.StatusBadRequest)
			return
		}

		file, handler, err := r.FormFile("file")
		if err != nil {
			http.Error(w, "Unable to retrieve file", http.StatusBadRequest)
			return
		}
		defer file.Close()

		// Get upload path from query params or use default
		uploadPath := r.URL.Query().Get("path")
		if uploadPath == "" {
			uploadPath = "./uploads"
		}

		// Create upload directory if it doesn't exist
		err = os.MkdirAll(uploadPath, 0755)
		if err != nil {
			http.Error(w, "Unable to create upload directory", http.StatusInternalServerError)
			return
		}

		// Create destination file
		destPath := filepath.Join(uploadPath, filepath.Base(handler.Filename))
		dst, err := os.Create(destPath)
		if err != nil {
			http.Error(w, "Unable to save file", http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		// Copy uploaded file to destination
		if _, err := io.Copy(dst, file); err != nil {
			http.Error(w, "Unable to save file", http.StatusInternalServerError)
			return
		}

		fmt.Fprintf(w, "File uploaded successfully to: %s", destPath)
		return
	}

	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}

func main() {
	// Register the handler function for the "/" route.
	http.HandleFunc("/", handler)
	http.HandleFunc("/upload", uploadHandler)

	// Start the web server on port 8080.
	log.Println("Starting server on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
