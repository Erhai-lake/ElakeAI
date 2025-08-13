<script>
import Button from "@/components/Button.vue"
import HazardousOperations from "@/components/options/HazardousOperations.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass";

export default {
	name: "AdvancedToolsView",
	components: {Button, HazardousOperations},
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
		{{ t("views.AdvancedToolsView.hazardousOperations") }}
		<HazardousOperations/>
	</div>
</template>
