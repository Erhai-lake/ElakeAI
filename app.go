package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

type PluginMeta map[string]interface{}

func (a *App) LoadPlugins() ([]PluginMeta, error) {
	var plugins []PluginMeta
	// 获取当前程序所在目录
	cwd, _ := os.Getwd()
	execPath, _ := os.Executable()
	execDir := filepath.Dir(execPath)
	var pluginRoot string
	// dev 模式
	devPlugins := filepath.Join(cwd, "frontend", "plugins")
	if _, err := os.Stat(devPlugins); err == nil {
		pluginRoot = devPlugins
	} else {
		// build 模式
		pluginRoot = filepath.Join(execDir, "plugins")
	}
	// 遍历 pluginRoot 下所有 plugin.json
	filepath.Walk(pluginRoot, func(path string, info os.FileInfo, err error) error {
		if info == nil || info.IsDir() || info.Name() != "plugin.json" {
			return nil
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return nil
		}
		var meta PluginMeta
		if err := json.Unmarshal(data, &meta); err != nil {
			return nil
		}
		entry := "index.js"
		if val, ok := meta["entry"].(string); ok && val != "" {
			entry = val
		}
		// system 判断
		system := strings.Contains(path, "system")
		// 修正 entry 路径(相对 plugins 根目录)
		rel, _ := filepath.Rel(pluginRoot, filepath.Join(filepath.Dir(path), entry))
		meta["entry"] = filepath.ToSlash(filepath.Join("plugins", rel))
		meta["system"] = system
		plugins = append(plugins, meta)
		return nil
	})
	return plugins, nil
}
