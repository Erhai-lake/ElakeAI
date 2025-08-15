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

export default {
	name: "DevTools",
	inject: ["$DB", "$log"],
	components: {
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
					<Button @click="clearDB('chats')">{{ t("components.DevTools.clear") }}</Button>
					<div class="database-list">
						<div class="database-item" v-for="item in chats" :key="item.key">
							<span class="database-title">{{ item.title }}</span>
							<span class="database-key">{{ item.key }}</span>
							<input
								type="text"
								class="database-input"
								:value="JSON.stringify(item, null)"
								@blur="updateByKey('chats', item.key, JSON.parse($event.target.value))">
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
							<input
								type="text"
								class="database-input"
								:value="JSON.stringify(item, null)"
								@blur="updateByKey('configs', item.item, JSON.parse($event.target.value))">
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
							<input
								type="text"
								class="database-input"
								:value="JSON.stringify(item, null)"
								@blur="updateByKey('apiKeys', item.key, JSON.parse($event.target.value))">
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