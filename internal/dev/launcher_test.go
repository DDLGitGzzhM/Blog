package dev_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"blog/internal/dev"

	"github.com/stretchr/testify/require"
)

func TestWaitForAPIReady(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	err := dev.WaitForAPIForTest(ctx, server.URL, 2*time.Second)
	require.NoError(t, err)
}

func TestWaitForAPITimeout(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	err := dev.WaitForAPIForTest(ctx, "http://127.0.0.1:1", 500*time.Millisecond)
	require.Error(t, err)
}
