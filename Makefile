.PHONY: roadmap-api dev test

roadmap-api:
	go run ./cmd/roadmap-api

dev:
	@echo "请在两个终端分别运行："
	@echo "  make roadmap-api"
	@echo "  hugo server -D --disableLiveReload"
	@echo ""
	@echo "编辑 roadmap 时请加 --disableLiveReload，避免保存 markdown 后整页刷新。"

test:
	go test ./...
