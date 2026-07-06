# Blog 本地开发一键启动（roadmap-api + Hugo）
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
go run ./cmd/blog-dev @args
