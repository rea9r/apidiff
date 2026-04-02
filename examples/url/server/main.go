package main

import (
	"log"
	"net/http"
	"time"
)

func main() {
	oldMux := http.NewServeMux()
	oldMux.Handle("/", http.FileServer(http.Dir("examples/url/old")))

	newMux := http.NewServeMux()
	newMux.Handle("/", http.FileServer(http.Dir("examples/url/new")))

	go func() {
		log.Println("serving old JSON at http://127.0.0.1:18081")
		srv := &http.Server{
			Addr:              ":18081",
			Handler:           oldMux,
			ReadHeaderTimeout: 10 * time.Second,
		}
		if err := srv.ListenAndServe(); err != nil {
			log.Fatal(err)
		}
	}()

	log.Println("serving new JSON at http://127.0.0.1:18082")
	srv := &http.Server{
		Addr:              ":18082",
		Handler:           newMux,
		ReadHeaderTimeout: 10 * time.Second,
	}
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
