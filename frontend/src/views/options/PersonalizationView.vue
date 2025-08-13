<script>
import ThemeSelect from "@/components/options/ThemeSwitch.vue"
import LanguageSelect from "@/components/options/LanguageSelect.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"

export default {
	name: "PersonalizationView",
	components: {LanguageSelect, ThemeSelect},
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
		{{ t("views.PersonalizationView.theme") }}
		<ThemeSelect/>
	</div>
	<div class="item">
		{{ t("views.PersonalizationView.language") }}
		<LanguageSelect/>
	</div>
</template>
