package dev

import (
	"fmt"
	"os"
	"path/filepath"
)

// DetectBlogRoot finds the Hugo blog repository root from an optional start directory.
func DetectBlogRoot(start string) (string, error) {
	dir := start
	if dir == "" {
		wd, err := os.Getwd()
		if err != nil {
			return "", fmt.Errorf("get working directory: %w", err)
		}
		dir = wd
	}

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

	return "", fmt.Errorf("未找到 hugo.yaml，请在 Blog 项目目录内运行")
}
