package roadmap

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

// Entry describes one roadmap in data/roadmaps.yaml.
type Entry struct {
	ID    string `yaml:"id"`
	Title string `yaml:"title"`
	File  string `yaml:"file"`
}

// Config loads roadmap metadata and resolves markdown file paths.
type Config struct {
	root    string
	entries []Entry
}

// NewConfig loads roadmaps.yaml from blogRoot/data/roadmaps.yaml.
func NewConfig(blogRoot string) (*Config, error) {
	configPath := filepath.Join(blogRoot, "data", "roadmaps.yaml")
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("读取路线图配置失败: %w", err)
	}

	var entries []Entry
	if err := yaml.Unmarshal(data, &entries); err != nil {
		return nil, fmt.Errorf("解析路线图配置失败: %w", err)
	}

	return &Config{root: blogRoot, entries: entries}, nil
}

// Entries returns all configured roadmaps.
func (c *Config) Entries() []Entry {
	out := make([]Entry, len(c.entries))
	copy(out, c.entries)
	return out
}

// Find returns the entry for id, or an error if not found.
func (c *Config) Find(id string) (Entry, error) {
	for _, entry := range c.entries {
		if entry.ID == id {
			return entry, nil
		}
	}
	return Entry{}, fmt.Errorf("未找到路线图: %s", id)
}

// MarkdownPath returns the absolute path for a roadmap markdown file.
func (c *Config) MarkdownPath(entry Entry) (string, error) {
	if entry.File == "" {
		return "", fmt.Errorf("路线图 %s 未配置 file 字段", entry.ID)
	}
	clean := filepath.Clean(entry.File)
	if clean != entry.File || filepath.IsAbs(clean) || strings.Contains(entry.File, "..") {
		return "", fmt.Errorf("非法文件路径: %s", entry.File)
	}
	return filepath.Join(c.root, "assets", "roadmaps", clean), nil
}
