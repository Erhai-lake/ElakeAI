const { MSICreator } = require("electron-wix-msi")
const FS = require("fs")
const PATH = require("path")

// App 配置
const APP_NAME = "elake_ai"
const VERSION = "1.0.0"
const APP_DIR = PATH.resolve(__dirname, "../dist_electron/win-unpacked")
const OUT_DIR = PATH.resolve(__dirname, "../dist_electron/installer")

// 创建 MSI 安装器
const MSI_CREATOR = new MSICreator({
	appDirectory: APP_DIR,
	outputDirectory: OUT_DIR,
	description: "elake_ai 人工智能平台",
	exe: APP_NAME,
	name: APP_NAME,
	manufacturer: "洱海",
	version: VERSION,
	appIconPath: PATH.resolve(__dirname, "../src/assets/images/logo/logo.ico"),
	ui: {
		chooseDirectory: true
	}
})

async function build() {
	console.log("🛠️ 正在生成安装器配置...")
	await MSI_CREATOR.create()

	console.log("✍️ 正在添加自定义卸载逻辑...")
	const WXS_PATH = PATH.join(OUT_DIR, "elake_ai.wxs")
	let wxsContent = FS.readFileSync(WXS_PATH, "utf-8")

	// 添加自定义属性(用户选择是否保留数据)
	wxsContent = wxsContent.replace(
		"</Product>",
		`
  			<Property Id="DELETE_USERDATA" Value="yes"/>
  			<Property Id="DELETE_LOGS" Value="yes"/>
  			<Property Id="DELETE_PLUGINS" Value="yes"/>
			
  			<CustomAction Id="AskToDelete" Directory="INSTALLFOLDER"
  			  ExeCommand="cmd.exe /c echo 清理 >> delete.flag"
  			  Execute="immediate" Return="ignore" />
			
  			<CustomAction Id="DeleteFolders" Directory="INSTALLFOLDER"
  			  ExeCommand="cmd.exe /c del /s /q /f logs\\*.* &amp;&amp; rmdir /s /q logs plugins userdata"
  			  Execute="deferred" Return="ignore" />
			
  			<InstallExecuteSequence>
  			  <Custom Action="DeleteFolders" After="RemoveFiles">REMOVE="ALL"</Custom>
  			</InstallExecuteSequence>
			</Product>`
	)

	FS.writeFileSync(WXS_PATH, wxsContent)
	console.log("✅ 自定义逻辑注入完毕")

	console.log("📦 正在编译安装包...")
	await MSI_CREATOR.compile()

	console.log("🎉 安装包构建完成！请前往：", OUT_DIR)
}

build().catch((error) => {
	console.error("❌ 安装包构建失败:", error)
})