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
				"personalization",
				"chats",
				"import",
				"export",
				"plugins",
				"advancedTools",
				"about"
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
				:key="item"
				:to="`/options/${item}`"
				class="menu-item"
				active-class="active"
				exact-active-class="active">
				{{ t(`views.OptionsView.${item}`) }}
			</router-link>
		</div>
	</div>
</template>

<style scoped lang="less">
.options-view {
	height: 100%;
	user-select: none;
	display: grid;
	grid-template-columns: 1fr 256px;
}

.sidebar {
	padding: 10px;
	border-left: 1px solid var(--border-color);

	.menu-item {
		padding: 10px;
		margin-bottom: 10px;
		cursor: pointer;
		border-radius: 20px;
		border: 2px solid transparent;
		display: flex;
		transition: background-color 0.3s ease-in-out;

		&:hover {
			background-color: var(--sidebar-item-hover-background-color);
		}

		&.active {
			border: 2px solid var(--theme-color);
		}
	}
}

.main-content {
	padding: 20px;
	overflow-y: auto;
}
</style>