package dev

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

const (
	defaultAPIAddr = "http://127.0.0.1:8787"
	hugoCacheDir   = "blog-dev"
)

// EnsureGoModules downloads Go module dependencies for the blog project.
func EnsureGoModules(blogRoot string) error {
	log.Println("检查 Go 模块依赖...")
	cmd := exec.Command("go", "mod", "download")
	cmd.Dir = blogRoot
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("go mod download: %w", err)
	}
	return nil
}

// EnsureHugo returns a usable Hugo Extended binary path, installing it when missing.
func EnsureHugo(ctx context.Context) (string, error) {
	if path, err := exec.LookPath("hugo"); err == nil {
		log.Printf("已找到 Hugo: %s", path)
		return path, nil
	}

	if path, err := cachedHugoPath(); err == nil {
		if _, statErr := os.Stat(path); statErr == nil {
			log.Printf("已找到缓存 Hugo: %s", path)
			return path, nil
		}
	}

	log.Println("未找到 Hugo，正在自动安装 Extended 版...")
	if runtime.GOOS == "windows" {
		if err := installHugoViaWinget(ctx); err == nil {
			if path, findErr := findInstalledHugo(); findErr == nil {
				log.Printf("winget 安装完成: %s", path)
				return path, nil
			}
		} else {
			log.Printf("winget 安装失败，改为从 GitHub 下载: %v", err)
		}
	}

	path, err := downloadHugoExtended(ctx)
	if err != nil {
		return "", err
	}
	log.Printf("Hugo 已下载到: %s", path)
	return path, nil
}

func hugoCacheRoot() (string, error) {
	base, err := os.UserCacheDir()
	if err != nil {
		return "", fmt.Errorf("resolve user cache dir: %w", err)
	}
	return filepath.Join(base, hugoCacheDir), nil
}

func cachedHugoPath() (string, error) {
	root, err := hugoCacheRoot()
	if err != nil {
		return "", err
	}
	name := "hugo"
	if runtime.GOOS == "windows" {
		name = "hugo.exe"
	}
	return filepath.Join(root, name), nil
}

func findInstalledHugo() (string, error) {
	if path, err := exec.LookPath("hugo"); err == nil {
		return path, nil
	}

	candidates := []string{
		`C:\Program Files\Hugo\hugo.exe`,
	}
	if localAppData := os.Getenv("LOCALAPPDATA"); localAppData != "" {
		candidates = append(candidates, filepath.Join(localAppData, "Programs", "Hugo", "hugo.exe"))
	}

	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			return candidate, nil
		}
	}

	return "", fmt.Errorf("安装后仍未找到 hugo 可执行文件")
}

func installHugoViaWinget(ctx context.Context) error {
	cmd := exec.CommandContext(
		ctx,
		"winget",
		"install",
		"Hugo.Hugo.Extended",
		"--accept-package-agreements",
		"--accept-source-agreements",
		"--disable-interactivity",
	)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}
