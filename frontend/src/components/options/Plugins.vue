<script>
import {getAllPlugins, updatePluginEnabled} from "@/services/plugin/PluginManager"
import {initEnabledPlugins} from "@/services/plugin/RegisterPlugins"
import FoldingPanel from "@/components/FoldingPanel.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"

export default {
	name: "Plugins",
	inject: ["$log"],
	components: {FoldingPanel},
	data() {
		return {
			name: "Plugins",
			isWails: !!window.go,
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
			this.loadPlugInList(newVal, "system")
		},
		"thirdParty.activeTab"(newVal) {
			this.loadPlugInList(newVal, "thirdParty")
		}
	},
	created() {
		this.loadPlugInList("all", "all")
	},
	computed: {
		// 是否全选(系统插件)
		isAllSelectedSystem() {
			const AVAILABLE_PLUGINS = this.system.plugins.filter(plugin => !plugin.disabled)
			return AVAILABLE_PLUGINS.length > 0 &&
				AVAILABLE_PLUGINS.every(item =>
					this.system.operationSelection.includes(item.uuid)
				)
		},
		// 是否全选(第三方插件)
		isAllSelectedThirdParty() {
			const AVAILABLE_PLUGINS = this.thirdParty.plugins.filter(plugin => !plugin.disabled)
			return AVAILABLE_PLUGINS.length > 0 &&
				AVAILABLE_PLUGINS.every(item =>
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
		 * @param type {String} - 类型, 可选值: "all", "platform", "theme", "i18n", "other"
		 * @param category {String} - 分类, 可选值: "all", "system", "thirdParty"
		 */
		async loadPlugInList(type = "all", category = "all") {
			const KNOWN_TYPES = ["platform", "i18n"]
			const ALL_PLUGINS = await getAllPlugins()
			// 类型过滤
			let filtered = ALL_PLUGINS.filter(plugin => {
				const TYPES = Array.isArray(plugin.type) ? plugin.type : []
				if (type === "all") return true
				if (type === "other") {
					return TYPES.length === 0 || !TYPES.some(t => KNOWN_TYPES.includes(t))
				}
				return TYPES.includes(type)
			})
			if (category === "all") {
				this.system.plugins = []
				this.thirdParty.plugins = []
			}
			if (category === "system") this.system.plugins = []
			if (category === "thirdParty") this.thirdParty.plugins = []
			// 分类过滤 + 分配到对应列表
			for (const plugin of filtered) {
				if (category === "all" || category === "system") {
					if (plugin.system) this.system.plugins.push(plugin)
				}
				if (category === "all" || category === "thirdParty") {
					if (!plugin.system) this.thirdParty.plugins.push(plugin)
				}
			}
		},
		/**
		 * 切换全选状态(系统插件)
		 */
		toggleAllSelectionSystem() {
			if (this.isAllSelectedSystem) {
				this.system.operationSelection = []
			} else {
				this.system.operationSelection = this.system.plugins
					.filter(plugin => !plugin.disabled)
					.map(item => item.uuid)
			}
		},
		/**
		 * 切换全选状态(第三方插件)
		 */
		toggleAllSelectionThirdParty() {
			if (this.isAllSelectedThirdParty) {
				this.thirdParty.operationSelection = []
			} else {
				this.thirdParty.operationSelection = this.thirdParty.plugins
					.filter(plugin => !plugin.disabled)
					.map(item => item.uuid)
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
			if (plugin.disabled) {
				this.$log.warn(`[${this.name}] 标记为 disabled 的插件被禁止启用! ${plugin.name}`)
				toastRegistry.warning(`[${this.name}] ${this.t("components.Options.Plugins.toast.disabledTip")}`)
				return
			}
			if (plugin.required) {
				this.$log.warn(`[${this.name}] 标记为 required 的插件不能被禁用! ${plugin.name}`)
				toastRegistry.warning(`[${this.name}] ${this.t("components.Options.Plugins.toast.requiredTip")}`)
				return
			}
			try {
				const NEW_STATUS = !plugin.enabled
				await updatePluginEnabled(plugin.uuid, NEW_STATUS)
				toastRegistry.success(`[${this.name}] ${this.t(`components.Options.Plugins.toast.${NEW_STATUS ? "enable" : "disable"}Success`)}`)
				await initEnabledPlugins()
				await this.loadPlugInList(this.system.activeTab, "system")
				await this.loadPlugInList(this.thirdParty.activeTab, "thirdParty")
			} catch (error) {
				this.$log.error(`[${this.name}] 状态更新失败 ${plugin.name}`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.Options.Plugins.toast.statusUpdateError")}`)
			}
		}
	}
}
</script>

<template>
	<div class="plugins-view">
		<FoldingPanel :Height="600" :is="true">
			<template #Title>
				{{ t("components.Options.Plugins.systemPlugins") }}
			</template>
			<template #Content>
				<div class="header"></div>
				<button
					:class="{ active: system.activeTab === 'all' }"
					@click="system.activeTab = 'all'">
					{{ t("components.Options.Plugins.type.all") }}
				</button>
				<button
					:class="{ active: system.activeTab === 'platform' }"
					@click="system.activeTab = 'platform'">
					{{ t("components.Options.Plugins.type.platform") }}
				</button>
				<button
					:class="{ active: system.activeTab === 'theme' }"
					@click="system.activeTab = 'theme'">
					{{ t("components.Options.Plugins.type.theme") }}
				</button>
				<button
					:class="{ active: system.activeTab === 'i18n' }"
					@click="system.activeTab = 'i18n'">
					{{ t("components.Options.Plugins.type.i18n") }}
				</button>
				<button
					:class="{ active: system.activeTab === 'other' }"
					@click="system.activeTab = 'other'">
					{{ t("components.Options.Plugins.type.other") }}
				</button>
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
						<th>{{ t("components.Options.Plugins.info.enabled") }}</th>
						<th>{{ t("components.Options.Plugins.info.name") }}</th>
						<th>{{ t("components.Options.Plugins.info.author") }}</th>
						<th>{{ t("components.Options.Plugins.info.description") }}</th>
						<th>{{ t("components.Options.Plugins.info.version") }}</th>
					</tr>
					</thead>
					<tbody>
					<tr
						v-for="plugin in system.plugins"
						:key="plugin.uuid"
						:title="plugin.disabled ? t('components.Options.Plugins.toast.disabledTip') : ''"
						@click="!plugin.disabled && toggleRowSelectionSystem(plugin.uuid)"
						:class="{
							'selected-row': system.operationSelection.includes(plugin.uuid),
							'disabled-row': plugin.disabled
						}">
						<td>
							<label>
								<input type="checkbox"
									   :value="plugin.uuid"
									   v-model="system.operationSelection"
									   :disabled="plugin.disabled"
									   @click.stop>
								<span class="custom-checkbox"></span>
							</label>
						</td>
						<td>
							<label>
								<input
									type="checkbox"
									:checked="plugin.enabled"
									:disabled="plugin.disabled || plugin.required"
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
						<td colspan="6" class="empty-tip">{{ t("components.Options.Plugins.noPlugins") }}</td>
					</tr>
					</tbody>
				</table>
			</template>
		</FoldingPanel>
		<FoldingPanel :Height="600">
			<template #Title>
				{{ t("components.Options.Plugins.thirdPartyPlugins") }}
				<span style="margin-left: 20px;color: #F44336;">
					({{ t("components.Options.Plugins.thirdPartyPluginsTip") }})
				</span>
			</template>
			<template #Content>
				<div class="header"></div>
				<button
					:class="{ active: thirdParty.activeTab === 'all' }"
					@click="thirdParty.activeTab = 'all'">
					{{ t("components.Options.Plugins.type.all") }}
				</button>
				<button
					:class="{ active: thirdParty.activeTab === 'platform' }"
					@click="thirdParty.activeTab = 'platform'">
					{{ t("components.Options.Plugins.type.platform") }}
				</button>
				<button
					:class="{ active: thirdParty.activeTab === 'theme' }"
					@click="thirdParty.activeTab = 'theme'">
					{{ t("components.Options.Plugins.type.theme") }}
				</button>
				<button
					:class="{ active: thirdParty.activeTab === 'i18n' }"
					@click="thirdParty.activeTab = 'i18n'">
					{{ t("components.Options.Plugins.type.i18n") }}
				</button>
				<button
					:class="{ active: thirdParty.activeTab === 'other' }"
					@click="thirdParty.activeTab = 'other'">
					{{ t("components.Options.Plugins.type.other") }}
				</button>
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
						<th>{{ t("components.Options.Plugins.info.enabled") }}</th>
						<th>{{ t("components.Options.Plugins.info.name") }}</th>
						<th>{{ t("components.Options.Plugins.info.author") }}</th>
						<th>{{ t("components.Options.Plugins.info.description") }}</th>
						<th>{{ t("components.Options.Plugins.info.version") }}</th>
					</tr>
					</thead>
					<tbody>
					<tr
						v-for="plugin in thirdParty.plugins"
						:key="plugin.uuid"
						:title="plugin.disabled ? t('components.Options.Plugins.toast.disabledTip') : ''"
						@click="!plugin.disabled && toggleRowSelectionThirdParty(plugin.uuid)"
						:class="{
							'selected-row': thirdParty.operationSelection.includes(plugin.uuid),
							'disabled-row': plugin.disabled
						}">
						<td>
							<label>
								<input type="checkbox"
									   :value="plugin.uuid"
									   v-model="thirdParty.operationSelection"
									   :disabled="plugin.disabled"
									   @click.stop>
								<span class="custom-checkbox"></span>
							</label>
						</td>
						<td>
							<label>
								<input
									type="checkbox"
									:checked="plugin.enabled"
									:disabled="plugin.disabled"
									@change="togglePluginEnable(plugin)">
								<span class="custom-checkbox"></span>
							</label>
						</td>
						<td :title="plugin.name">{{ plugin.name }}</td>
						<td :title="plugin.author">{{ plugin.author }}</td>
						<td :title="plugin.description">{{ plugin.description }}</td>
						<td :title="plugin.version">{{ plugin.version }}</td>
					</tr>
					<tr v-if="!isWails">
						<td colspan="6">{{ t("components.Options.Plugins.envProhibition") }}</td>
					</tr>
					<tr v-if="(thirdParty.plugins || []).length === 0 && isWails">
						<td colspan="6">{{ t("components.Options.Plugins.noPlugins") }}</td>
					</tr>
					</tbody>
				</table>
			</template>
		</FoldingPanel>
	</div>
</template>

<style scoped lang="less">
button {
	padding: 8px 16px;
	background: none;
	border: none;
	border-bottom: 1px solid transparent;
	color: var(--text-color);
	font-size: 14px;
	cursor: pointer;
}

.active {
	border-bottom: 1px solid var(--theme-color);
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
		transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
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
		width: 25%;
	}

	th:nth-child(4), td:nth-child(4) {
		width: 15%;
	}

	th:nth-child(5), td:nth-child(5) {
		width: 30%;
	}

	th:nth-child(6), td:nth-child(6) {
		width: 10%;
	}

	.selected-row {
		color: var(--text-color);
		background-color: var(--active-background-color);

		&:hover {
			color: var(--text-color);
			background-color: var(--active-background-color);

			.custom-checkbox {
				&::after {
					background-color: var(--background-color-anti);
				}
			}
		}
	}

	.disabled-row {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;

		&:hover {
			color: var(--text-color);
			background-color: transparent;
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