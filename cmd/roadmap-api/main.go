package main

import (
	"flag"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"blog/internal/roadmap"

	"github.com/gin-gonic/gin"
)

const defaultAddr = "127.0.0.1:8787"

func main() {
	addr := flag.String("addr", defaultAddr, "listen address")
	root := flag.String("root", "", "blog repository root (default: auto-detect)")
	flag.Parse()

	blogRoot := *root
	if blogRoot == "" {
		var err error
		blogRoot, err = detectBlogRoot()
		if err != nil {
			log.Fatal(err)
		}
	}

	config, err := roadmap.NewConfig(blogRoot)
	if err != nil {
		log.Fatal(err)
	}

	store := roadmap.NewStore(config)
	handler := roadmap.NewHandler(store)

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery(), corsMiddleware())

	api := router.Group("/api")
	handler.Register(api)

	log.Printf("roadmap-api 已启动: http://%s (root=%s)", *addr, blogRoot)
	if err := router.Run(*addr); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}

func detectBlogRoot() (string, error) {
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}

	dir := wd
	for {
		if _, err := os.Stat(filepath.Join(dir, "hugo.yaml")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}

	return wd, nil
}

func corsMiddleware() gin.HandlerFunc {
	allowedOrigins := map[string]struct{}{
		"http://localhost:1313": {},
		"http://127.0.0.1:1313":   {},
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if _, ok := allowedOrigins[origin]; ok {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Methods", "GET, PUT, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Content-Type")
			c.Header("Vary", "Origin")
		}

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		if origin != "" {
			if !strings.HasPrefix(origin, "http://localhost:") &&
				!strings.HasPrefix(origin, "http://127.0.0.1:") {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
					"error": "仅允许本地开发环境访问",
				})
				return
			}
		}

		c.Next()
	}
}
