<script>
import {isElectron} from "@/services/Env"
import {getAllPlugins, updatePluginEnabled} from "@/services/plugin/PluginManager"
import {initEnabledPlugins} from "@/services/plugin/RegisterPlugins"
import FoldingPanel from "@/components/FoldingPanel.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import Tabs from "@/components/Tabs.vue";
import TabsTab from "@/components/TabsTab.vue";

export default {
	name: "PluginsView",
	components: {TabsTab, Tabs, FoldingPanel},
	data() {
		return {
			name: "PluginsView",
			isElectron: isElectron(),
			system: {
				activeTab: "all",
				plugins: [],
				operationSelection: []
			},
			thirdParty: {
				activeTab: "all",
				plugins: [],
				operationSelection: []
			}
		}
	},
	watch: {
		"system.activeTab"(newVal) {
			this.loadPlugInList(newVal)
		},
		"thirdParty.activeTab"(newVal) {
			this.loadPlugInList(newVal)
		}
	},
	created() {
		this.loadPlugInList("all")
	},
	computed: {
		// 是否全选
		isAllSelectedSystem() {
			return this.system.plugins.length > 0 &&
				this.system.plugins.every(item =>
					this.system.operationSelection.includes(item.uuid)
				)
		},
		isAllSelectedThirdParty() {
			return this.thirdParty.plugins.length > 0 &&
				this.thirdParty.plugins.every(item =>
					this.thirdParty.operationSelection.includes(item.uuid)
				)
		}
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
		 * 加载插件列表
		 * @param type {String} - 类型, 可选值: "all", "platform", "i18n", "other"
		 */
		async loadPlugInList(type = "all") {
			const KNOWN_TYPES = ["platform", "i18n"]
			const PLUGINS = await getAllPlugins()
			if (type === "all") {
				this.system.plugins = PLUGINS
				return
			}
			this.system.plugins = PLUGINS.filter(plugin => {
				const TYPES = Array.isArray(plugin.type) ? plugin.type : []
				if (type === "other") {
					// 没有类型 或 没有与已知类型匹配的, 都归为 Other
					return TYPES.length === 0 || !TYPES.some(t => KNOWN_TYPES.includes(t))
				}
				// 其他分类: 匹配 plugin.type 中是否包含当前类型
				return TYPES.includes(type)
			})
		},
		/**
		 * 切换全选状态(系统插件)
		 */
		toggleAllSelectionSystem() {
			if (this.isAllSelectedSystem) {
				this.system.operationSelection = []
			} else {
				this.system.operationSelection = this.system.plugins.map(item => item.uuid)
			}
		},
		/**
		 * 切换全选状态(第三方插件)
		 */
		toggleAllSelectionThirdParty() {
			if (this.isAllSelectedThirdParty) {
				this.thirdParty.operationSelection = []
			} else {
				this.thirdParty.operationSelection = this.thirdParty.plugins.map(item => item.uuid)
			}
		},
		/**
		 * 切换行选择状态(系统插件)
		 * @param uuid {String} - uuid
		 */
		toggleRowSelectionSystem(uuid) {
			const INDEX = this.system.operationSelection.indexOf(uuid)
			if (INDEX === -1) {
				this.system.operationSelection.push(uuid)
			} else {
				this.system.operationSelection.splice(INDEX, 1)
			}
		},
		/**
		 * 切换行选择状态(第三方插件)
		 * @param uuid {String} - uuid
		 */
		toggleRowSelectionThirdParty(uuid) {
			const INDEX = this.thirdParty.operationSelection.indexOf(uuid)
			if (INDEX === -1) {
				this.thirdParty.operationSelection.push(uuid)
			} else {
				this.thirdParty.operationSelection.splice(INDEX, 1)
			}
		},
		/**
		 * 切换插件启用状态
		 * @param plugin
		 */
		async togglePluginEnable(plugin) {
			try {
				const NEW_STATUS = !plugin.enabled
				await updatePluginEnabled(plugin.uuid, NEW_STATUS)
				this.$toast.success(`[${this.name}] ${this.t(`views.PluginsView.toast.${NEW_STATUS ? "enable" : "disable"}Success`)}`)
				await initEnabledPlugins()
				await this.loadPlugInList()
			} catch (error) {
				this.$log.error(`[${this.name}] 状态更新失败`, error)
				this.$toast.error(`[${this.name}] ${this.t("views.PluginsView.toast.statusUpdateError")}`)
			}
		}
	}
}
</script>

<template>
	<div class="plugins-view">
		<FoldingPanel :Height="600">
			<template #Title>
				{{ t("views.PluginsView.systemPlugins") }}
			</template>
			<template #Content>
				<div class="header"></div>
				<Tabs v-model="system.activeTab">
					<TabsTab name="all">
						<template #label>{{ t("views.PluginsView.type.all") }}</template>
					</TabsTab>
					<TabsTab name="platform">
						<template #label>{{ t("views.PluginsView.type.platform") }}</template>
					</TabsTab>
					<TabsTab name="i18n">
						<template #label>{{ t("views.PluginsView.type.i18n") }}</template>
					</TabsTab>
					<TabsTab name="other">
						<template #label>{{ t("views.PluginsView.type.other") }}</template>
					</TabsTab>
				</Tabs>
				<table class="list">
					<thead>
					<tr>
						<th>
							<label>
								<input type="checkbox"
									   :checked="isAllSelectedSystem"
									   @change="toggleAllSelectionSystem">
								<span class="custom-checkbox"></span>
							</label>
						</th>
						<th>{{ t("views.PluginsView.info.enabled") }}</th>
						<th>{{ t("views.PluginsView.info.name") }}</th>
						<th>{{ t("views.PluginsView.info.author") }}</th>
						<th>{{ t("views.PluginsView.info.description") }}</th>
						<th>{{ t("views.PluginsView.info.version") }}</th>
					</tr>
					</thead>
					<tbody>
					<tr
						v-for="plugin in system.plugins"
						:key="plugin.uuid"
						@click="toggleRowSelectionSystem(plugin.uuid)"
						:class="{ 'selected-row': system.operationSelection.includes(plugin.uuid) }">
						<td>
							<label>
								<input type="checkbox"
									   :value="plugin.uuid"
									   v-model="system.operationSelection"
									   @click.stop>
								<span class="custom-checkbox"></span>
							</label>
						</td>
						<td>
							<label>
								<input
									type="checkbox"
									:checked="plugin.enabled"
									@change="togglePluginEnable(plugin)">
								<span class="custom-checkbox"></span>
							</label>
						</td>
						<td :title="plugin.name">{{ plugin.name }}</td>
						<td :title="plugin.author">{{ plugin.author }}</td>
						<td :title="plugin.description">{{ plugin.description }}</td>
						<td :title="plugin.version">{{ plugin.version }}</td>
					</tr>
					<tr v-if="(system.plugins || []).length === 0">
						<td colspan="6" class="empty-tip">{{ t("views.PluginsView.noPlugins") }}</td>
					</tr>
					</tbody>
				</table>
			</template>
		</FoldingPanel>
		<FoldingPanel :Height="600">
			<template #Title>
				{{ t("views.PluginsView.thirdPartyPlugins") }}
				<span style="margin-left: 20px;color: #F44336;">
					({{ t("views.PluginsView.thirdPartyPluginsTip") }})
				</span>
			</template>
			<template #Content>
				<table class="list">
					<thead>
					<tr>
						<th>
							<label>
								<input type="checkbox"
									   :checked="isAllSelectedThirdParty"
									   @change="toggleAllSelectionThirdParty">
								<span class="custom-checkbox"></span>
							</label>
						</th>
						<th>{{ t("views.PluginsView.info.enabled") }}</th>
						<th>{{ t("views.PluginsView.info.logo") }}</th>
						<th>{{ t("views.PluginsView.info.name") }}</th>
						<th>{{ t("views.PluginsView.info.author") }}</th>
						<th>{{ t("views.PluginsView.info.description") }}</th>
						<th>{{ t("views.PluginsView.info.version") }}</th>
					</tr>
					</thead>
					<tbody>
					<tr
						v-for="plugin in thirdParty.plugins"
						:key="plugin.uuid"
						@click="toggleRowSelectionThirdParty(plugin.uuid)"
						:class="{ 'selected-row': thirdParty.operationSelection.includes(plugin.uuid) }">
						<td>
							<label>
								<input type="checkbox"
									   :value="plugin.uuid"
									   v-model="thirdParty.operationSelection"
									   @click.stop>
								<span class="custom-checkbox"></span>
							</label>
						</td>
						<td>
							<label>
								<input
									type="checkbox"
									:checked="plugin.enabled"
									@change="togglePluginEnable(plugin)">
								<span class="custom-checkbox"></span>
							</label>
						</td>
						<td :title="plugin.name">{{ plugin.name }}</td>
						<td :title="plugin.author">{{ plugin.author }}</td>
						<td :title="plugin.description">{{ plugin.description }}</td>
						<td :title="plugin.version">{{ plugin.version }}</td>
					</tr>
					<tr v-if="!isElectron">
						<td colspan="6">{{ t("views.PluginsView.envProhibition") }}</td>
					</tr>
					<tr v-if="(thirdParty.plugins || []).length === 0 && isElectron">
						<td colspan="6">{{ t("views.PluginsView.noPlugins") }}</td>
					</tr>
					</tbody>
				</table>
			</template>
		</FoldingPanel>
	</div>
</template>

<style scoped lang="less">
.plugins-view {
	padding: 20px;
}

.list {
	min-width: 1000px;
	width: 100%;
	border-collapse: collapse;
	table-layout: fixed;

	th, td {
		padding: 10px;
		box-sizing: border-box;
		border: 1px solid var(--border-color);
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	tbody tr {
		transition: background-color 0.2s;
		cursor: pointer;

		&:hover {
			color: var(--text-color-anti);
			background-color: var(--background-color-anti);

			.custom-checkbox {
				&::after {
					background-color: var(--background-color);
				}
			}
		}
	}

	th:nth-child(1), td:nth-child(1) {
		width: 10%;
	}

	th:nth-child(2), td:nth-child(2) {
		width: 10%;
		pointer-events: auto;
	}

	th:nth-child(3), td:nth-child(3) {
		width: 20%;
	}

	th:nth-child(4), td:nth-child(4) {
		width: 25%;
	}

	th:nth-child(5), td:nth-child(5) {
		width: 25%;
	}

	th:nth-child(6), td:nth-child(6) {
		width: 10%;
	}

	.selected-row {
		--Active-Background-Color: rgba(107, 130, 145, 0.5);
		color: var(--text-color);
		background-color: var(--Active-Background-Color);

		&:hover {
			color: var(--text-color);
			background-color: var(--Active-Background-Color);

			.custom-checkbox {
				&::after {
					background-color: var(--background-color-anti);
				}
			}
		}
	}
}

input[type="checkbox"] {
	display: none;

	&:checked + .custom-checkbox::after {
		opacity: 1;

	}
}

.custom-checkbox {
	display: inline-block;
	width: 20px;
	height: 20px;
	box-sizing: border-box;
	vertical-align: middle;
	border: 2px solid var(--border-color);
	border-radius: 4px;
	position: relative;
	cursor: pointer;

	&::after {
		content: "";
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 10px;
		height: 10px;
		background-color: var(--background-color-anti);
		border-radius: 2px;
		opacity: 0;
	}
}
</style>