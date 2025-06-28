<script>
import {isElectron} from "@/services/env"
import {getAllPlugins, updatePluginEnabled} from "@/services/plugin/pluginManager"
import {initEnabledPlugins} from "@/services/plugin/registerPlugins"
import FoldingPanel from "@/components/FoldingPanel.vue"

export default {
	name: "PluginsView",
	components: {FoldingPanel},
	data() {
		return {
			name: "PluginsView",
			isElectron: isElectron(),
			system: {
				plugins: [],
				operationSelection: []
			},
			thirdParty: {
				plugins: [],
				operationSelection: []
			}
		}
	},
	created() {
		this.loadPlugInList()
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
		 * 加载插件列表
		 */
		async loadPlugInList() {
			this.system.plugins = await getAllPlugins()
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
				this.$toast.success(`[${this.name}] ${this.$t(`views.PluginsView.toast.${NEW_STATUS ? "enable" : "disable"}Success`)}`)
				await initEnabledPlugins()
				await this.loadPlugInList()
			} catch (error) {
				this.$log.error(`[${this.name}] 状态更新失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("views.PluginsView.toast.statusUpdateError")}`)
			}
		}
	}
}
</script>

<template>
	<div class="plugins-view">
		<FoldingPanel :Height="600">
			<template #Title>
				{{ $t("views.PluginsView.systemPlugins") }}
			</template>
			<template #Content>
				<div class="header"></div>
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
						<th>{{ $t("views.PluginsView.pluginEnable") }}</th>
						<th>{{ $t("views.PluginsView.pluginName") }}</th>
						<th>{{ $t("views.PluginsView.pluginAuthor") }}</th>
						<th>{{ $t("views.PluginsView.pluginDescription") }}</th>
						<th>{{ $t("views.PluginsView.pluginVersion") }}</th>
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
						<td colspan="6" class="empty-tip">{{ $t("views.PluginsView.noPlugins") }}</td>
					</tr>
					</tbody>
				</table>
			</template>
		</FoldingPanel>
		<FoldingPanel :Height="600">
			<template #Title>
				{{ $t("views.PluginsView.thirdPartyPlugins") }}
				<span style="margin-left: 20px;color: #F44336;">
					({{ $t("views.PluginsView.thirdPartyPluginsTip") }})
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
						<th>{{ $t("views.PluginsView.pluginEnable") }}</th>
						<th>{{ $t("views.PluginsView.pluginName") }}</th>
						<th>{{ $t("views.PluginsView.pluginAuthor") }}</th>
						<th>{{ $t("views.PluginsView.pluginDescription") }}</th>
						<th>{{ $t("views.PluginsView.pluginVersion") }}</th>
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
						<td colspan="6">{{ $t("views.PluginsView.envProhibition") }}</td>
					</tr>
					<tr v-if="(thirdParty.plugins || []).length === 0 && isElectron">
						<td colspan="6">{{ $t("views.PluginsView.noPlugins") }}</td>
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