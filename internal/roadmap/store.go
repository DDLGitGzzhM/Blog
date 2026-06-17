package roadmap

import (
	"fmt"
	"os"
	"path/filepath"
)

// Store reads and writes roadmap markdown files on disk.
type Store struct {
	config *Config
}

// NewStore creates a Store backed by config.
func NewStore(config *Config) *Store {
	return &Store{config: config}
}

// ReadMarkdown returns markdown content for the given roadmap id.
func (s *Store) ReadMarkdown(id string) (string, error) {
	entry, err := s.config.Find(id)
	if err != nil {
		return "", err
	}

	path, err := s.config.MarkdownPath(entry)
	if err != nil {
		return "", err
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("读取路线图文件失败: %w", err)
	}

	return string(data), nil
}

// WriteMarkdown persists markdown content for the given roadmap id.
func (s *Store) WriteMarkdown(id, content string) error {
	entry, err := s.config.Find(id)
	if err != nil {
		return err
	}

	path, err := s.config.MarkdownPath(entry)
	if err != nil {
		return err
	}

	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("创建目录失败: %w", err)
	}

	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		return fmt.Errorf("写入路线图文件失败: %w", err)
	}

	return nil
}
