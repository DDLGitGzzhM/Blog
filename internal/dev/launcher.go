package dev

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"sync"
	"syscall"
	"time"
)

// Launcher starts roadmap-api and Hugo together for local development.
type Launcher struct {
	BlogRoot string
	HugoBin  string
	APIAddr  string
}

// NewLauncher builds a launcher with defaults for the blog dev environment.
func NewLauncher(blogRoot, hugoBin string) *Launcher {
	return &Launcher{
		BlogRoot: blogRoot,
		HugoBin:  hugoBin,
		APIAddr:  defaultAPIAddr,
	}
}

// Run starts child processes and stops them when the context is cancelled.
func (l *Launcher) Run(ctx context.Context) error {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
	defer signal.Stop(sigCh)

	go func() {
		select {
		case <-sigCh:
			log.Println("正在停止开发服务...")
			cancel()
		case <-ctx.Done():
		}
	}()

	apiCmd := exec.CommandContext(ctx, "go", "run", "./cmd/roadmap-api")
	apiCmd.Dir = l.BlogRoot
	apiCmd.Stdout = os.Stdout
	apiCmd.Stderr = os.Stderr

	if err := apiCmd.Start(); err != nil {
		return fmt.Errorf("start roadmap-api: %w", err)
	}

	if err := waitForAPI(ctx, l.APIAddr+"/api/health", 20*time.Second); err != nil {
		log.Printf("roadmap-api 健康检查超时，继续启动 Hugo: %v", err)
	}

	hugoCmd := exec.CommandContext(
		ctx,
		l.HugoBin,
		"server",
		"-D",
		"--disableLiveReload",
	)
	hugoCmd.Dir = l.BlogRoot
	hugoCmd.Stdout = os.Stdout
	hugoCmd.Stderr = os.Stderr

	if err := hugoCmd.Start(); err != nil {
		stopProcess(apiCmd)
		return fmt.Errorf("start hugo server: %w", err)
	}

	log.Println("Blog 开发环境已启动:")
	log.Printf("  站点: http://localhost:1313")
	log.Printf("  API:  %s", l.APIAddr)
	log.Println("  按 Ctrl+C 停止")

	var wg sync.WaitGroup
	errCh := make(chan error, 2)

	wg.Add(2)
	go l.waitProcess(ctx, &wg, errCh, apiCmd)
	go l.waitProcess(ctx, &wg, errCh, hugoCmd)

	select {
	case <-ctx.Done():
		stopProcess(apiCmd)
		stopProcess(hugoCmd)
		wg.Wait()
		return nil
	case err := <-errCh:
		cancel()
		stopProcess(apiCmd)
		stopProcess(hugoCmd)
		wg.Wait()
		if err != nil && ctx.Err() == nil {
			return err
		}
		return nil
	}
}

func (l *Launcher) waitProcess(
	ctx context.Context,
	wg *sync.WaitGroup,
	errCh chan<- error,
	cmd *exec.Cmd,
) {
	defer wg.Done()
	if err := cmd.Wait(); err != nil && ctx.Err() == nil {
		errCh <- err
	}
}

func waitForAPI(ctx context.Context, url string, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	client := &http.Client{Timeout: 2 * time.Second}

	for time.Now().Before(deadline) {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			return err
		}

		resp, err := client.Do(req)
		if err == nil {
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				return nil
			}
		}

		time.Sleep(300 * time.Millisecond)
	}

	return fmt.Errorf("等待 %s 超时", url)
}

func stopProcess(cmd *exec.Cmd) {
	if cmd == nil || cmd.Process == nil {
		return
	}
	_ = cmd.Process.Kill()
}
