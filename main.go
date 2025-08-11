package main

import (
	"embed"
	"log"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

var assets embed.FS

func main() {
	// 获取当前运行路径(软件根目录)
	exePath, err := os.Executable()
	if err != nil {
		log.Fatal(err)
	}
	rootDir := filepath.Dir(exePath)

	// 设置临时目录到根目录 tmp
	tmpDir := filepath.Join(rootDir, "tmp")
	_ = os.MkdirAll(tmpDir, 0755)
	os.Setenv("TMP", tmpDir)
	os.Setenv("TEMP", tmpDir)

	// 自定义缓存目录
	webviewDataDir := filepath.Join(rootDir, "UserData")
	_ = os.MkdirAll(webviewDataDir, 0755)

	app := NewApp()

	err = wails.Run(&options.App{
		Title:  "ElakeAi",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup: app.startup,
		Bind: []any{
			app,
		},
		Windows: &windows.Options{
			WebviewUserDataPath: webviewDataDir,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
