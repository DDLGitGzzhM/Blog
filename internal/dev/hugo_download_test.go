package dev_test

import (
	"runtime"
	"testing"

	"blog/internal/dev"

	"github.com/stretchr/testify/require"
)

func TestHugoAssetNameWindows(t *testing.T) {
	if runtime.GOOS != "windows" {
		t.Skip("windows asset naming only")
	}

	name, err := dev.HugoAssetNameForTest("v0.163.3")
	require.NoError(t, err)
	require.Equal(t, "hugo_extended_0.163.3_windows-amd64.zip", name)
}

func TestHugoAssetNameLinux(t *testing.T) {
	if runtime.GOOS != "linux" {
		t.Skip("linux asset naming only")
	}

	name, err := dev.HugoAssetNameForTest("v0.163.3")
	require.NoError(t, err)
	require.Equal(t, "hugo_extended_0.163.3_linux-amd64.tar.gz", name)
}

func TestHugoAssetNameDarwin(t *testing.T) {
	if runtime.GOOS != "darwin" {
		t.Skip("darwin asset naming only")
	}

	name, err := dev.HugoAssetNameForTest("v0.163.3")
	require.NoError(t, err)
	require.Equal(t, "hugo_extended_0.163.3_darwin-universal.tar.gz", name)
}
