.PHONY: roadmap-api dev test

roadmap-api:
	go run ./cmd/roadmap-api

dev:
	go run ./cmd/blog-dev

test:
	go test ./...
