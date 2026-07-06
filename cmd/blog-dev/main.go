package main

import (
	"context"
	"log"
	"os"

	"blog/internal/dev"
)

func main() {
	log.SetFlags(0)

	blogRoot, err := dev.DetectBlogRoot("")
	if err != nil {
		log.Fatal(err)
	}

	if err := dev.EnsureGoModules(blogRoot); err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()
	hugoBin, err := dev.EnsureHugo(ctx)
	if err != nil {
		log.Fatal(err)
	}

	launcher := dev.NewLauncher(blogRoot, hugoBin)
	if err := launcher.Run(ctx); err != nil {
		log.Println(err)
		os.Exit(1)
	}
}
