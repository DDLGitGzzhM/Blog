package roadmap_test

import (
	"os"
	"path/filepath"
	"testing"

	"blog/internal/roadmap"

	"github.com/stretchr/testify/require"
)

func setupTestBlog(t *testing.T) string {
	t.Helper()

	root := t.TempDir()
	require.NoError(t, os.MkdirAll(filepath.Join(root, "data"), 0o755))
	require.NoError(t, os.MkdirAll(filepath.Join(root, "assets", "roadmaps"), 0o755))

	configYAML := `- id: demo
  title: Demo Roadmap
  file: demo.md
`
	require.NoError(t, os.WriteFile(
		filepath.Join(root, "data", "roadmaps.yaml"),
		[]byte(configYAML),
		0o644,
	))

	markdown := "# Demo\n\n## Section\n- item\n"
	require.NoError(t, os.WriteFile(
		filepath.Join(root, "assets", "roadmaps", "demo.md"),
		[]byte(markdown),
		0o644,
	))

	return root
}

func TestNewConfigLoadsEntries(t *testing.T) {
	root := setupTestBlog(t)

	config, err := roadmap.NewConfig(root)
	require.NoError(t, err)

	entries := config.Entries()
	require.Len(t, entries, 1)
	require.Equal(t, "demo", entries[0].ID)
	require.Equal(t, "Demo Roadmap", entries[0].Title)
}

func TestStoreReadWriteMarkdown(t *testing.T) {
	root := setupTestBlog(t)

	config, err := roadmap.NewConfig(root)
	require.NoError(t, err)

	store := roadmap.NewStore(config)

	content, err := store.ReadMarkdown("demo")
	require.NoError(t, err)
	require.Contains(t, content, "# Demo")

	updated := "# Demo Updated\n\n## New Section\n"
	require.NoError(t, store.WriteMarkdown("demo", updated))

	written, err := os.ReadFile(filepath.Join(root, "assets", "roadmaps", "demo.md"))
	require.NoError(t, err)
	require.Equal(t, updated, string(written))
}

func TestStoreReadMarkdownNotFound(t *testing.T) {
	root := setupTestBlog(t)

	config, err := roadmap.NewConfig(root)
	require.NoError(t, err)

	store := roadmap.NewStore(config)

	_, err = store.ReadMarkdown("missing")
	require.Error(t, err)
}

func TestConfigMarkdownPathRejectsTraversal(t *testing.T) {
	root := setupTestBlog(t)

	config, err := roadmap.NewConfig(root)
	require.NoError(t, err)

	entry, err := config.Find("demo")
	require.NoError(t, err)

	entry.File = "../secret.md"
	_, err = config.MarkdownPath(entry)
	require.Error(t, err)
}
