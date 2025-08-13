<script>
import HazardousOperations from "@/components/options/HazardousOperations.vue"
import Plugins from "@/components/options/Plugins.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"

export default {
	name: "OptionsView",
	components: {
		HazardousOperations,
		Plugins
	},
	data() {
		return {
			menuItems: [
				{key: "personalization", label: "views.OptionsView.personalization"},
				{key: "chats", label: "views.OptionsView.chats"},
				{key: "import_export", label: "views.OptionsView.importExport"},
				{key: "plugins", label: "views.OptionsView.plugins"},
				{key: "advanced_tools", label: "views.OptionsView.advancedTools"},
				{key: "about", label: "views.OptionsView.about"}
			],
			activeKey: "personalization"
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
		}
	}
}
</script>

<template>
	<div class="options-view">
		<div class="main-content">
			<router-view/>
		</div>
		<div class="sidebar">
			<router-link
				v-for="item in menuItems"
				:key="item.key"
				:to="`/options/${item.key}`"
				class="menu-item"
				active-class="active"
				exact-active-class="active">
				{{ t(item.label) }}
			</router-link>
		</div>
	</div>
</template>

<style scoped lang="less">
.options-view {
	height: 100%;
	user-select: none;
	display: grid;
	grid-template-columns: 1fr 240px;
}

.sidebar {
	border-left: 1px solid var(--border-color);
	padding: 10px;

	.menu-item {
		padding: 10px;
		margin-bottom: 10px;
		cursor: pointer;
		border-radius: 20px;
		border: 2px solid transparent;
		display: flex;

		&:hover {
			background-color: var(--sidebar-item-hover-background-color);
		}

		&.active {
			border: 2px solid #80ceff;
		}
	}
}

.main-content {
	padding: 20px;
	overflow-y: auto;
}
</style>

<style>
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
</style>