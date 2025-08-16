<script>
import ThemeSelect from "@/components/options/ThemeSwitch.vue"
import LanguageSelect from "@/components/options/LanguageSelect.vue"
import ChatThemesSelect from "@/components/options/ChatThemesSelect.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import BackgroundImage from "@/components/options/BackgroundImage.vue"

export default {
	name: "PersonalizationView",
	components: {BackgroundImage, LanguageSelect, ThemeSelect, ChatThemesSelect},
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
	<div class="item">
		{{ t("views.OptionsView.PersonalizationView.theme") }}
		<ThemeSelect/>
	</div>
	<div class="item">
		{{ t("views.OptionsView.PersonalizationView.language") }}
		<LanguageSelect/>
	</div>
	<div class="item">
		{{ t("views.OptionsView.PersonalizationView.chatThemes") }}
		<ChatThemesSelect/>
	</div>
	<div class="item">
		{{ t("views.OptionsView.PersonalizationView.backgroundImage") }}
		<BackgroundImage/>
	</div>
</template>
