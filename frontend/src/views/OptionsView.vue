<script>
import FoldingPanel from "@/components/FoldingPanel.vue"
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
		FoldingPanel,
		Plugins
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
	<div class="options-container">
		<FoldingPanel>
			<template #Title>
				{{ t("views.OptionsView.personalization") }}
			</template>
			<template #Content>
				<div class="item">
					{{ t("views.OptionsView.theme") }}
					<ThemeSelect/>
				</div>
				<div class="item">
					{{ t("views.OptionsView.language") }}
					<LanguageSelect/>
				</div>
			</template>
		</FoldingPanel>
		<FoldingPanel :Height="600">
			<template #Title>
				{{ t("views.OptionsView.chats") }}
			</template>
			<template #Content>
				<ChatAIKey/>
				<div class="item">
					{{ t("views.OptionsView.defaultChatSettings") }}
					<DefaultChatSettings/>
				</div>
			</template>
		</FoldingPanel>
		<FoldingPanel :Height="500">
			<template #Title>
				{{ t("views.OptionsView.importExport") }}
			</template>
			<template #Content>
				<ImportExport/>
			</template>
		</FoldingPanel>
		<FoldingPanel :Height="600">
			<template #Title>
				{{ t("views.OptionsView.plugins") }}
			</template>
			<template #Content>
				<Plugins/>
			</template>
		</FoldingPanel>
		<FoldingPanel>
			<template #Title>
				{{ t("views.OptionsView.advancedTools") }}
			</template>
			<template #Content>
				<div class="tool-item-list">
					<router-link to="/options/debug">
						<Button>BeBUG</Button>
					</router-link>
					<router-link to="/options/log">
						<Button>Log</Button>
					</router-link>
				</div>
				<FoldingPanel style="--bg-color: #F44336" :Height="50">
					<template #Title>
						{{ t("views.OptionsView.hazardousOperations") }}
					</template>
					<template #Content>
						<HazardousOperations/>
					</template>
				</FoldingPanel>
			</template>
		</FoldingPanel>
		<FoldingPanel>
			<template #Title>
				{{ t("views.OptionsView.about") }}
			</template>
			<template #Content>
				<div class="tool-item-list">
					<router-link to="/options/about">
						<Button>{{ t("views.OptionsView.aboutApp") }}</Button>
					</router-link>
					<a href="https://github.com/Erhai-lake/ElakeAI" target="_blank">
						<Button>{{ t("views.OptionsView.githubRepo") }}</Button>
					</a>
					<a href="mailto:fuzixuan0714.0826@gmail.com">
						<Button>{{ t("views.OptionsView.contactSupport") }}</Button>
					</a>
				</div>
			</template>
		</FoldingPanel>
	</div>
</template>

<style scoped lang="less">
.options-container {
	padding: 20px;
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

.tool-item-list {
	margin: 5px 0;
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}

.container {
	padding: 20px;
	margin: 5px 0;
	border-radius: 10px;
	user-select: none;
	background-color: #b3b3b33f;
	display: flex;
	gap: 10px;
}
</style>