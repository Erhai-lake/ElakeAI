<script>
import Tabs from "@/components/Tabs.vue"
import TabsTab from "@/components/TabsTab.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import Log from "@/components/options/Log.vue"
import ThemeSelect from "@/components/options/ThemeSwitch.vue"
import LanguageSelect from "@/components/options/LanguageSelect.vue"
import DefaultChatSettings from "@/components/options/DefaultChatSettings.vue"
import ChatAIKey from "@/components/options/ChatsAIKey.vue"
import Plugins from "@/components/options/Plugins.vue"
import router from "@/router"
import Button from "@/components/Button.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import EventBus from "@/services/EventBus"
import FoldingPanel from "@/components/FoldingPanel.vue"
import InputText from "@/components/InputText.vue"

export default {
	name: "DevTools",
	inject: ["$DB", "$log"],
	components: {
		InputText,
		FoldingPanel,
		Plugins, ChatAIKey, DefaultChatSettings, LanguageSelect, ThemeSelect, Log, TabsTab, Tabs, Button
	},
	data() {
		return {
			name: "DevTools",
			activeTab: "router",
			allRoutes: [],
			chats: [],
			configs: [],
			apiKeys: []
		}
	},
	created() {
		this.allRoutes = this.flattenRoutes(router.options.routes)
		this.getDBData()
	},
	methods: {
		/**
		 * 翻译
		 * @param key {String} - 键
		 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
		 * @returns {String} - 翻译后的文本
		 */
		t(key, params = {}) {
			return i18nRegistry.translate(key, params)
		},
		/**
		 * 递归获取路由
		 * @param routes {Array} - 路由数组
		 * @param basePath {String} - 基础路径
		 * @returns {Array} - 路由数组
		 */
		flattenRoutes(routes, basePath = "") {
			return routes.flatMap(route => {
				const FULL_PATH = route.path.startsWith("/") ? route.path : `${basePath.replace(/\/$/, "")}/${route.path}`
				const current = {
					name: route.name || "(no name)",
					path: FULL_PATH
				}
				if (route.children && route.children.length) {
					return [current, ...this.flattenRoutes(route.children, FULL_PATH)]
				}
				return [current]
			})
		},
		/**
		 * 跳转路由
		 * @param path {String} - 路由路径
		 */
		goTo(path) {
			router.push(path)
		},
		/**
		 * 获取数据库数据
		 */
		async getDBData() {
			this.chats = await this.getDBAll("chats")
			this.configs = await this.getDBAll("configs")
			this.apiKeys = await this.getDBAll("apiKeys")
		},
		/**
		 * 获取所有数据库表数据
		 * @param tableName {String} - 表名
		 */
		getDBAll(tableName) {
			try {
				return this.$DB[tableName].toArray()
			} catch (error) {
				this.$log.error(`[${this.name}] 获取 ${tableName} 数据失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.DevTools.toast.failedToGetData")}`, tableName)
				return []
			}
		},
		/**
		 * 生成DEBUG聊天
		 */
		async generateDebugChat() {
			if (!confirm(this.t("components.DevTools.toast.areYouSureToGenerateDebugChat"))) return
			const DEBUG_CHAT = [
				{
					title: "各种标题测试",
					content: "# 你好!\n\n## 你好!!\n\n### 你好!!!\n\n#### 你好!!!!\n\n##### 你好!!!!!\n\n###### 你好!!!!!!",
					model: {"platform": "OpenAI", "model": "gpt-4o"}
				},
				{
					title: "文字属性测试",
					content: "加粗: **加粗**\n\n斜体: *斜体*\n\n删除线: ~~删除线~~",
					model: {"platform": "OpenAI", "model": "gpt-4o"}
				},
				{
					title: "段落测试",
					content: "123\n456\n\n489\n123\n\n456\n\n489",
					model: {"platform": "OpenAI", "model": "gpt-4o"}
				},
				{
					title: "引用测试",
					content: "单行引用:\n\n> 单行引用\n\n多行引用:\n\n> 多行引用\n> 多行引用\n> 多行引用\n\n嵌套引用:\n\n> 嵌套引用\n> > 嵌套引用\n> > > 嵌套引用",
					model: {"platform": "OpenAI", "model": "gpt-4o"}
				},
				{
					title: "列表测试",
					content: "无序列表\n\n* 11111\n* 22222\n* 33333\n* 44444\n* 55555\n\n有序列表\n\n1. 11111\n2. 22222\n3. 33333\n4. 44444\n5. 55555\n\n嵌套列表\n\n* 11111\n    * 2222",
					model: {"platform": "OpenAI", "model": "gpt-4o"}
				},
				{
					title: "代码行测试",
					content: "右边的代码: `print(\"你好, 世界!\")` 这个是Python!",
					model: {"platform": "OpenAI", "model": "gpt-4o"}
				},
				{
					title: "代码块测试",
					content: "代码块测试\n\n```js\nfunction hello() {\n  console.log(\"Hello, world!\")\n}\n```\n\n这是一段JavaScript代码, lang属性写的是js",
					model: {"platform": "OpenAI", "model": "gpt-4o"}
				},
				{
					title: "分割行测试",
					content: "分割行测试\n\n***\n\n123456789",
					model: {"platform": "OpenAI", "model": "gpt-4o"}
				},
				{
					title: "链接测试",
					content: "[Markdown语法](https://markdown.com.cn \"最好的markdown教程\")\n\n<https://markdown.com.cn>",
					model: {"platform": "OpenAI", "model": "gpt-4o"}
				},
				{
					title: "图片测试",
					content: "![图片](https://flagcdn.com/cn.svg \"中国国旗\")\n\n![图片](https://img.loliapi.com/i/pc/img462.webp \"二次元\")",
					model: {"platform": "OpenAI", "model": "gpt-4o"}
				},
				{
					title: "表格测试",
					content: "| Syntax      | Description | Test Text     |\n| :---        |    :----:   |          ---: |\n| Header      | Title       | Here's this   |\n| Paragraph   | Text        | And more      |",
					model: {"platform": "OpenAI", "model": "gpt-4o"}
				},
				{
					title: "任务列表测试",
					content: "- [x] Write the press release\n- [ ] Update the website\n- [ ] Contact the media",
					model: {"platform": "OpenAI", "model": "gpt-4o"}
				},
				{
					title: "Emoji测试",
					content: "去露营了！ :tent: 很快回来。",
					model: {"platform": "OpenAI", "model": "gpt-4o"}
				},
				{
					title: "数学公式测试",
					content: "假设$x=2$, 那么$x^2=?$\n\n$$\n\\frac{\\mathrm{d}}{\\mathrm{d}x}\\cos x=-\\sin x\n$$\n\nKaTeX:\n\n$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$\n\nMathJax3:\n\n$$ \\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$",
					model: {"platform": "OpenAI", "model": "gpt-4o"}
				},
				{
					title: "流程图测试",
					content: "Mermaid\n\n```mermaid\nflowchart TD;A[Christmas] -->|Get money| B(Go shopping);B --> C{Let me think};C -->|One| D[Laptop];C -->|Two| E[iPhone];C -->|Three| F[fa:fa-car Car];C --> D((This is the <br  />text<br  /> in the circle))\n```\n\n```mermaid\ngraph TD; A[开始] --> B{是否登录？}; B -- 是 --> C[进入系统]; B -- 否 --> D[跳转登录页]; D --> E[登录后返回]; E --> C\n```\n\nFlowchart\n\n```flow\nst=>start: 开始\ne=>end: 结束\nop=>operation: 输入用户名和密码\ncond=>condition: 验证成功？\nerr=>operation: 提示错误\nlogin=>operation: 跳转首页\n\nst->op->cond\ncond(yes)->login->e\ncond(no)->err->op\n```\n\n```flow\nst=>start: 开始\ne=>end: 结束\nop=>operation: 输入用户名和密码\ncond=>condition: 验证成功？\nerr=>operation: 提示错误\nlogin=>operation: 跳转首页\n\nst->op->cond\ncond(yes)->login->e\ncond(no)->err->op\n```\n\nPlantUML\n\n```plantuml\n@startuml\nskinparam backgroundColor #EEEBDC\n\nskinparam sequenceArrowColor DeepSkyBlue\nskinparam sequenceActorBorderColor DeepSkyBlueskinparam sequenceActorBorderColor DeepSkyBlue\nskinparam sequenceLifeLineBorderColor blue\nskinparam sequenceLifeLineBackgroundColor #A9DCDF\nskinparam sequenceParticipantBorderColor DeepSkyBlue\nskinparam sequenceParticipantBackgroundColor DodgerBlue\nskinparam sequenceParticipantFontName Impact\nskinparam sequenceParticipantFontSize 17\nskinparam sequenceParticipantFontColor #A9DCDF\nskinparam sequenceActorBackgroundColor aqua\nskinparam sequenceActorFontColor DeepSkyBlue\nskinparam sequenceActorFontSize 17\nskinparam sequenceActorFontName Aapex\n\nactor User\nparticipant \"First Class\" as ParticipantA\nparticipant \"Second Class\" as ParticipantB\nparticipant \"Last Class\" as ParticipantC\n\nUser -> ParticipantA: DoWork\nactivate ParticipantA\n\nParticipantA -> ParticipantB: Create Request\nactivate ParticipantBv\nParticipantB -> ParticipantC: DoWork\nactivate ParticipantC\nParticipantC --> ParticipantB: WorkDone\ndestroy ParticipantC\nParticipantB --> ParticipantA: Request Created\ndeactivate ParticipantB\n\nParticipantA --> User: Done\ndeactivate ParticipantA\n@enduml",
					model: {"platform": "OpenAI", "model": "gpt-4o"}
				}
			]
			for (const chat of DEBUG_CHAT) {
				await this.$DB.chats.add({
					key: crypto.randomUUID(),
					title: chat.title,
					timestamp: Date.now(),
					data: [
						{
							id: crypto.randomUUID(),
							message: {content: chat.title, role: "user"},
							timestamp: Date.now()
						},
						{
							id: crypto.randomUUID(),
							model: chat.model,
							message: {reasoning: chat.content, content: chat.content, role: "assistant"},
							timestamp: Date.now()
						}
					]
				})
			}
			EventBus.emit("[update] chatListUpdate")
			await this.getDBData()
			toastRegistry.success(this.t("components.DevTools.toast.generateDebugChatSuccess"))
		},
		/**
		 * 清空数据库表数据
		 * @param tableName {String} - 表名
		 */
		async clearDB(tableName) {
			if (!confirm(`确定要清空 ${tableName} 数据吗?`)) return
			try {
				await this.$DB[tableName].clear()
				EventBus.emit("[update] chatListUpdate")
				this.$log.info(`[${this.name}] 清空 ${tableName} 数据成功`)
				toastRegistry.success(`[${this.name}] ${this.t("components.DevTools.toast.clearSuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 清空 ${tableName} 数据失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.DevTools.toast.clearError")}`)
			}
			await this.getDBData()
		},
		/**
		 * 删除数据库表数据
		 * @param tableName {String} - 表名
		 * @param key {String} - 键
		 * @param filterKey {String} - 过滤键
		 */
		async deleteByKey(tableName, key, filterKey) {
			if (!confirm(`确定要删除 ${tableName} 数据吗?`)) return
			try {
				await this.$DB[tableName].delete(key)
				EventBus.emit("[update] chatListUpdate")
				this.$log.info(`[${this.name}] 删除 ${tableName} 数据成功`, {key, filterKey})
				toastRegistry.success(`[${this.name}] ${this.t("components.DevTools.toast.deleteSuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 删除 ${tableName} 数据失败`, {key, filterKey, error})
				toastRegistry.error(`[${this.name}] ${this.t("components.DevTools.toast.deleteError")}`)
			}
			await this.getDBData()
		},
		/**
		 * 更新数据库表数据
		 * @param tableName {String} - 表名
		 * @param key {String} - 键
		 * @param data {Object} - 数据
		 */
		async updateByKey(tableName, key, data) {
			try {
				// 先获取数据判断是否一致, 不一致在更新
				const OLD_DATA = await this.$DB[tableName].get(key)
				if (JSON.stringify(OLD_DATA) === JSON.stringify(data)) {
					this.$log.info(`[${this.name}] 更新 ${tableName} 数据失败, 数据未改变`, {key, data})
					toastRegistry.info(`[${this.name}] ${this.t("components.DevTools.toast.updateSameData")}`)
					return
				}
				await this.$DB[tableName].update(key, data)
				EventBus.emit("[update] chatListUpdate")
				this.$log.info(`[${this.name}] 更新 ${tableName} 数据成功`, {key, data})
				toastRegistry.success(`[${this.name}] ${this.t("components.DevTools.toast.updateSuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 更新 ${tableName} 数据失败`, {key, data, error})
				toastRegistry.error(`[${this.name}] ${this.t("components.DevTools.toast.updateError")}`)
			}
			await this.getDBData()
		}
	}
}
</script>

<template>
	<Tabs v-model="activeTab">
		<TabsTab name="router">
			<template #label>{{ t("components.DevTools.router") }}</template>
			<div class="router-list">
				<div class="router-item" v-for="item in allRoutes" :key="item.path">
					<span class="router-name">{{ item.name }}</span>
					<span class="router-path">{{ item.path }}</span>
					<Button class="router-btn" @click="goTo(item.path)">
						{{ t("components.DevTools.goTo") }}
					</Button>
				</div>
			</div>
		</TabsTab>
		<TabsTab name="options">
			<template #label>{{ t("components.DevTools.options") }}</template>
			<div class="item">
				{{ t("views.PersonalizationView.theme") }}
				<ThemeSelect/>
			</div>
			<div class="item">
				{{ t("views.PersonalizationView.language") }}
				<LanguageSelect/>
			</div>
			<ChatAIKey/>
			<div class="item">
				{{ t("views.ChatsView.defaultChat") }}
				<DefaultChatSettings/>
			</div>
		</TabsTab>
		<TabsTab name="database">
			<template #label>{{ t("components.DevTools.database") }}</template>
			<FoldingPanel>
				<template #Title>chats</template>
				<template #Content>
					<Button @click="generateDebugChat">{{ t("components.DevTools.generateDebugChat") }}</Button>
					<Button @click="clearDB('chats')">{{ t("components.DevTools.clear") }}</Button>
					<div class="database-list">
						<div class="database-item" v-for="item in chats" :key="item.key">
							<span class="database-title">{{ item.title }}</span>
							<span class="database-key">{{ item.key }}</span>
							<InputText
								class="database-input"
								:value="JSON.stringify(item, null)"
								@blur="updateByKey('chats', item.key, JSON.parse($event.target.value))"/>
							<Button class="database-btn" @click="deleteByKey('chats', item.key, 'key')">
								{{ t("components.DevTools.delete") }}
							</Button>
						</div>
					</div>
				</template>
			</FoldingPanel>
			<FoldingPanel>
				<template #Title>configs</template>
				<template #Content>
					<Button @click="clearDB('configs')">{{ t("components.DevTools.clear") }}</Button>
					<div class="database-list">
						<div class="database-item" v-for="item in configs" :key="item.item">
							<span class="database-title">{{ item.item }}</span>
							<InputText
								class="database-input"
								:value="JSON.stringify(item, null)"
								@blur="updateByKey('configs', item.item, JSON.parse($event.target.value))"/>
							<Button class="database-btn" @click="deleteByKey('configs', item.item, 'item')">
								{{ t("components.DevTools.delete") }}
							</Button>
						</div>
					</div>
				</template>
			</FoldingPanel>
			<FoldingPanel>
				<template #Title>apiKeys</template>
				<template #Content>
					<Button @click="clearDB('apiKeys')">{{ t("components.DevTools.clear") }}</Button>
					<div class="database-list">
						<div class="database-item" v-for="item in apiKeys" :key="item.key">
							<span class="database-title">{{ item.remark }}</span>
							<span class="database-key">{{ item.model }}</span>
							<span class="database-key">{{ item.key }}</span>
							<InputText
								class="database-input"
								:value="JSON.stringify(item, null)"
								@blur="updateByKey('apiKeys', item.key, JSON.parse($event.target.value))"/>
							<Button class="database-btn" @click="deleteByKey('apiKeys', item.key, 'key')">
								{{ t("components.DevTools.delete") }}
							</Button>
						</div>
					</div>
				</template>
			</FoldingPanel>
		</TabsTab>
		<TabsTab name="plugins">
			<template #label>{{ t("components.DevTools.plugins") }}</template>
			<Plugins/>
		</TabsTab>
		<TabsTab name="log">
			<template #label>{{ t("components.DevTools.log") }}</template>
			<Log/>
		</TabsTab>
	</Tabs>
</template>

<style scoped lang="less">
.item {
	padding: 10px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1px solid var(--border-color);
	border-top: 1px solid var(--border-color);
	white-space: nowrap;
	gap: 10px;
}

.router-list, .database-list {
	margin: 5px 0;

	.router-item, .database-item {
		padding: 5px;
		margin-bottom: 5px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-radius: 10px;
		border-bottom: 1px solid var(--border-color);
		background: var(--background-color);
		color: var(--text-color);

		&:hover {
			background: var(--background-color-anti);
			color: var(--text-color-anti);
		}

		.router-name, .database-title {
			flex: 1;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.router-path, .database-key {
			flex: 1;
			color: #888;
			padding: 0 8px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.router-btn, .database-btn {
			padding: 4px 10px;
			margin: 0 10px;
		}

		.database-input {
			flex: 2;
		}
	}
}
</style>