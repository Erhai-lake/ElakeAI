<script setup>
import ThemeSelect from "@/components/options/ThemeSwitch.vue"
import LanguageSelect from "@/components/options/LanguageSelect.vue"
import ChatThemesSelect from "@/components/options/ChatThemesSelect.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import LeftMenuTitle from "@/components/options/LeftMenuTitle.vue"
import LogoImage from "@/components/options/LogoImage.vue"
import BackgroundImage from "@/components/options/BackgroundImage.vue"
import PlantumlUrl from "@/components/options/PlantumlUrl.vue"

/**
 * 翻译函数
 * @function t
 * @param {string} key - 翻译键值
 * @param {Object} params - 翻译参数
 * @returns {string} - 翻译后的字符串
 */
const t = (key, params = {}) => {
	return i18nRegistry.translate(key, params)
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
		{{ t("views.OptionsView.PersonalizationView.leftMenuTitle") }}
		<LeftMenuTitle/>
	</div>
	<div class="item">
		{{ t("views.OptionsView.PersonalizationView.logoImage") }}
		<LogoImage/>
	</div>
	<div class="item">
		{{ t("views.OptionsView.PersonalizationView.backgroundImage") }}
		<BackgroundImage/>
	</div>
	<div class="item">
		{{ `${t("views.OptionsView.PersonalizationView.plantumlUrl")}\{\{encoded\}\}` }}
		<PlantumlUrl/>
	</div>
</template>

<style scoped lang="less">
.item {
	padding: 10px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	border-bottom: 1px solid var(--border-color);
	border-top: 1px solid var(--border-color);
	white-space: nowrap;
}
</style>