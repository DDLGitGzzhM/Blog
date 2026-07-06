package dev

import (
	"archive/tar"
	"archive/zip"
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

type githubRelease struct {
	TagName string `json:"tag_name"`
	Assets  []struct {
		Name               string `json:"name"`
		BrowserDownloadURL string `json:"browser_download_url"`
	} `json:"assets"`
}

func downloadHugoExtended(ctx context.Context) (string, error) {
	release, err := fetchLatestHugoRelease(ctx)
	if err != nil {
		return "", err
	}

	assetName, err := hugoAssetName(release.TagName)
	if err != nil {
		return "", err
	}

	var downloadURL string
	for _, asset := range release.Assets {
		if asset.Name == assetName {
			downloadURL = asset.BrowserDownloadURL
			break
		}
	}
	if downloadURL == "" {
		return "", fmt.Errorf("未找到 Hugo 安装包: %s", assetName)
	}

	cacheRoot, err := hugoCacheRoot()
	if err != nil {
		return "", err
	}
	if err := os.MkdirAll(cacheRoot, 0o755); err != nil {
		return "", fmt.Errorf("create hugo cache dir: %w", err)
	}

	archivePath := filepath.Join(cacheRoot, assetName)
	if err := downloadFile(ctx, downloadURL, archivePath); err != nil {
		return "", err
	}

	binaryName := "hugo"
	if runtime.GOOS == "windows" {
		binaryName = "hugo.exe"
	}
	destPath := filepath.Join(cacheRoot, binaryName)
	if err := extractHugoBinary(archivePath, destPath); err != nil {
		return "", err
	}

	if runtime.GOOS != "windows" {
		if err := os.Chmod(destPath, 0o755); err != nil {
			return "", fmt.Errorf("chmod hugo binary: %w", err)
		}
	}

	return destPath, nil
}

func fetchLatestHugoRelease(ctx context.Context) (*githubRelease, error) {
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		"https://api.github.com/repos/gohugoio/hugo/releases/latest",
		nil,
	)
	if err != nil {
		return nil, fmt.Errorf("create release request: %w", err)
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "blog-dev")

	client := &http.Client{Timeout: 2 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetch hugo release: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("fetch hugo release: HTTP %d", resp.StatusCode)
	}

	var release githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, fmt.Errorf("decode hugo release: %w", err)
	}
	if release.TagName == "" {
		return nil, fmt.Errorf("empty hugo release tag")
	}
	return &release, nil
}

func hugoAssetName(tag string) (string, error) {
	version := strings.TrimPrefix(tag, "v")
	switch runtime.GOOS {
	case "windows":
		if runtime.GOARCH != "amd64" {
			break
		}
		return fmt.Sprintf("hugo_extended_%s_windows-amd64.zip", version), nil
	case "linux":
		if runtime.GOARCH != "amd64" {
			break
		}
		return fmt.Sprintf("hugo_extended_%s_linux-amd64.tar.gz", version), nil
	case "darwin":
		return fmt.Sprintf("hugo_extended_%s_darwin-universal.tar.gz", version), nil
	}
	return "", fmt.Errorf("unsupported platform: %s/%s", runtime.GOOS, runtime.GOARCH)
}

func downloadFile(ctx context.Context, url, dest string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("create download request: %w", err)
	}

	client := &http.Client{Timeout: 5 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("download hugo archive: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download hugo archive: HTTP %d", resp.StatusCode)
	}

	file, err := os.Create(dest)
	if err != nil {
		return fmt.Errorf("create archive file: %w", err)
	}
	defer file.Close()

	if _, err := io.Copy(file, resp.Body); err != nil {
		return fmt.Errorf("write archive file: %w", err)
	}
	return nil
}

func extractHugoBinary(archivePath, destPath string) error {
	if strings.HasSuffix(strings.ToLower(archivePath), ".zip") {
		return extractHugoFromZip(archivePath, destPath)
	}
	return extractHugoFromTarGz(archivePath, destPath)
}

func extractHugoFromZip(archivePath, destPath string) error {
	reader, err := zip.OpenReader(archivePath)
	if err != nil {
		return fmt.Errorf("open zip archive: %w", err)
	}
	defer reader.Close()

	for _, file := range reader.File {
		name := filepath.Base(file.Name)
		if name != "hugo.exe" && name != "hugo" {
			continue
		}
		return copyZipEntry(file, destPath)
	}
	return fmt.Errorf("hugo binary not found in zip archive")
}

func copyZipEntry(file *zip.File, destPath string) error {
	src, err := file.Open()
	if err != nil {
		return fmt.Errorf("open zip entry: %w", err)
	}
	defer src.Close()

	out, err := os.Create(destPath)
	if err != nil {
		return fmt.Errorf("create hugo binary: %w", err)
	}
	defer out.Close()

	if _, err := io.Copy(out, src); err != nil {
		return fmt.Errorf("write hugo binary: %w", err)
	}
	return nil
}

func extractHugoFromTarGz(archivePath, destPath string) error {
	file, err := os.Open(archivePath)
	if err != nil {
		return fmt.Errorf("open tar archive: %w", err)
	}
	defer file.Close()

	gzReader, err := gzip.NewReader(file)
	if err != nil {
		return fmt.Errorf("create gzip reader: %w", err)
	}
	defer gzReader.Close()

	tarReader := tar.NewReader(gzReader)
	for {
		header, readErr := tarReader.Next()
		if readErr == io.EOF {
			break
		}
		if readErr != nil {
			return fmt.Errorf("read tar entry: %w", readErr)
		}
		name := filepath.Base(header.Name)
		if name != "hugo" {
			continue
		}
		out, createErr := os.Create(destPath)
		if createErr != nil {
			return fmt.Errorf("create hugo binary: %w", createErr)
		}
		if _, copyErr := io.Copy(out, tarReader); copyErr != nil {
			out.Close()
			return fmt.Errorf("write hugo binary: %w", copyErr)
		}
		if closeErr := out.Close(); closeErr != nil {
			return fmt.Errorf("close hugo binary: %w", closeErr)
		}
		return nil
	}
	return fmt.Errorf("hugo binary not found in tar archive")
}
