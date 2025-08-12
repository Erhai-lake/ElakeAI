<script>
import ThemeSelect from "@/components/options/ThemeSwitch.vue"
import LanguageSelect from "@/components/options/LanguageSelect.vue"
import ChatAIKey from "@/components/options/ChatsAIKey.vue"
import DefaultChatSettings from "@/components/options/DefaultChatSettings.vue"
import ImportExport from "@/components/options/ImportExport.vue"
import HazardousOperations from "@/components/options/HazardousOperations.vue"
import Plugins from "@/components/options/Plugins.vue"
import Button from "@/components/Button.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"

export default {
	name: "OptionsView",
	components: {
		HazardousOperations,
		ImportExport,
		DefaultChatSettings,
		Button,
		ChatAIKey,
		LanguageSelect,
		ThemeSelect,
		Plugins
	},
	data() {
		return {
			menuItems: [
				{key: "personalization", label: this.t("views.OptionsView.personalization")},
				{key: "chats", label: this.t("views.OptionsView.chats")},
				{key: "importExport", label: this.t("views.OptionsView.importExport")},
				{key: "plugins", label: this.t("views.OptionsView.plugins")},
				{key: "advancedTools", label: this.t("views.OptionsView.advancedTools")},
				{key: "about", label: this.t("views.OptionsView.about")}
			],
			activeKey: "personalization"
		}
	},
	beforeUnmount() {
		window.removeEventListener("hashchange", this.setActiveByHash)
	},
	created() {
		this.setActiveByHash()
		window.addEventListener("hashchange", this.setActiveByHash)
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
		 * 监听 hash 变化, 切换 activeKey
		 */
		setActiveByHash() {
			const HASHES = window.location.hash.split("#")
			const KEY = HASHES.length > 2 ? HASHES[2] : ""
			if (this.menuItems.some(item => item.key === KEY)) {
				this.activeKey = KEY
			}
		},
		/**
		 * 切换菜单
		 * @param key {String} - 键
		 */
		changeMenu(key) {
			const BASE_HASH = window.location.hash.split("#")[1] || "/options"
			window.location.hash = `${BASE_HASH}#${key}`
		}
	}
}
</script>

<template>
	<div class="options-layout">
		<div class="main-content">
			<div v-if="activeKey === 'personalization'">
				<div class="item">
					{{ t("views.OptionsView.theme") }}
					<ThemeSelect/>
				</div>
				<div class="item">
					{{ t("views.OptionsView.language") }}
					<LanguageSelect/>
				</div>
			</div>
			<div v-else-if="activeKey === 'chats'">
				<ChatAIKey/>
				<div class="item">
					{{ t("views.OptionsView.defaultChatSettings") }}
					<DefaultChatSettings/>
				</div>
			</div>
			<div v-else-if="activeKey === 'importExport'">
				<ImportExport/>
			</div>
			<div v-else-if="activeKey === 'plugins'">
				<Plugins/>
			</div>
			<div v-else-if="activeKey === 'advancedTools'">
				<div class="item">
					BeBUG View
					<router-link to="/options/debug">
						<Button>Open BeBUG View</Button>
					</router-link>
				</div>
				<div class="item">
					Log View
					<router-link to="/options/log">
						<Button>Open Log View</Button>
					</router-link>
				</div>
				<div class="item">
					{{ t("views.OptionsView.hazardousOperations") }}
					<HazardousOperations/>
				</div>
			</div>
			<div v-else-if="activeKey === 'about'">
				<div class="item">
					{{ t("views.OptionsView.aboutApp") }}
					<router-link to="/options/about">
						<Button>{{ t("views.OptionsView.aboutApp") }}</Button>
					</router-link>
				</div>
				<div class="item">
					{{ t("views.OptionsView.githubRepo") }}
					<a href="https://github.com/Erhai-lake/ElakeAI" target="_blank">
						<Button>{{ t("views.OptionsView.githubRepo") }}</Button>
					</a>
				</div>
				<div class="item">
					{{ t("views.OptionsView.contactSupport") }}
					<a href="mailto:fuzixuan0714.0826@gmail.com">
						<Button>{{ t("views.OptionsView.contactSupport") }}</Button>
					</a>
				</div>
			</div>
		</div>
		<div class="sidebar">
			<div
				v-for="item in menuItems"
				:key="item.key"
				:class="['menu-item', { active: activeKey === item.key }]"
				@click="changeMenu(item.key)">
				{{ item.label }}
			</div>
		</div>
	</div>
</template>

<style scoped lang="less">
.options-layout {
	display: flex;
	height: 100%;
	user-select: none;
}


.sidebar {
	width: 240px;
	border-left: 1px solid var(--border-color);
	padding: 10px;
}

.menu-item {
	padding: 10px;
	margin-bottom: 10px;
	cursor: pointer;
	border-radius: 20px;
	border: 2px solid transparent;

	&:hover {
		background-color: var(--sidebar-item-hover-background-color);
	}

	&.active {
		border: 2px solid #80ceff;
	}
}

.main-content {
	flex: 1;
	padding: 20px;
	overflow-y: auto;
}

.tool-item-list {
	margin: 5px 0;
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}

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