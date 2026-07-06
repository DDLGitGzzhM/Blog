package dev_test

import (
	"os"
	"path/filepath"
	"testing"

	"blog/internal/dev"

	"github.com/stretchr/testify/require"
)

func TestDetectBlogRootFromCurrentDirectory(t *testing.T) {
	root := t.TempDir()
	require.NoError(t, os.WriteFile(filepath.Join(root, "hugo.yaml"), []byte("title: test\n"), 0o644))

	subDir := filepath.Join(root, "content", "post")
	require.NoError(t, os.MkdirAll(subDir, 0o755))

	found, err := dev.DetectBlogRoot(subDir)
	require.NoError(t, err)
	require.Equal(t, root, found)
}

func TestDetectBlogRootMissingConfig(t *testing.T) {
	root := t.TempDir()
	_, err := dev.DetectBlogRoot(root)
	require.Error(t, err)
}
