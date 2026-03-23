package main

import (
	"log"
	"net/http"
)

func main() {
	oldMux := http.NewServeMux()
	oldMux.Handle("/", http.FileServer(http.Dir("examples/url/old")))

	newMux := http.NewServeMux()
	newMux.Handle("/", http.FileServer(http.Dir("examples/url/new")))

	go func() {
		log.Println("serving old JSON at http://127.0.0.1:18081")
		if err := http.ListenAndServe(":18081", oldMux); err != nil {
			log.Fatal(err)
		}
	}()

	log.Println("serving new JSON at http://127.0.0.1:18082")
	if err := http.ListenAndServe(":18082", newMux); err != nil {
		log.Fatal(err)
	}
}
