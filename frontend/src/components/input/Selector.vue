<script setup>
import {ref, computed, onMounted, onUnmounted} from "vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"

/**
 * 选择器组件
 */
const props = defineProps({
	selectorSelected: {
		type: Object,
		required: true
	},
	selectorList: {
		type: Array,
		required: true,
		default: () => []
	},
	uniqueKey: {
		type: String,
		required: true
	},
	num: {
		type: Number,
		default: 3
	},
	loading: {
		type: Boolean,
		default: false
	}
})

/**
 * 选择器组件事件
 */
const emit = defineEmits(["update:selectorSelected", "select"])

/**
 * 是否打开选择器列表
 */
const isOpen = ref(false)

/**
 * 下拉框方向
 */
const dropdownDirection = ref("bottom")

/**
 * 是否正在加载
 */
const isLoading = ref(false)

/**
 * 选择器元素
 */
const selectorElement = ref(null)

/**
 * 是否显示加载状态
 */
const showLoading = computed(() => props.loading || isLoading.value)

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

/**
 * 切换列表
 */
const toggleList = () => {
	if (showLoading.value) return
	if (!isOpen.value) {
		calculateDropdownDirection()
	}
	isOpen.value = !isOpen.value
}

/**
 * 计算下拉框的方向
 */
const calculateDropdownDirection = () => {
	const DROPDOWN_HEIGHT = props.num * 44
	const DROPDOWN_RECT = selectorElement.value.getBoundingClientRect()
	const DROPDOWN_BOTTOM = DROPDOWN_RECT.bottom + DROPDOWN_HEIGHT
	const WINDOW_HEIGHT = window.innerHeight
	dropdownDirection.value = DROPDOWN_BOTTOM > WINDOW_HEIGHT ? "top" : "bottom"
}

/**
 * 处理点击事件
 * @param e {Event} - 事件对象
 */
const handleClickOutside = (e) => {
	if (!selectorElement.value.contains(e.target)) {
		isOpen.value = false
	}
}

/**
 * 选择项
 * @param item {Object} - 选择项
 */
const selectItem = (item) => {
	if (showLoading.value) return
	isOpen.value = false
	emit("update:selectorSelected", item)
	emit("select", item)
}

/**
 * 标题
 * @param title {String} - 标题
 * @returns {String} - 标题
 */
const getTitle = (title) => {
	if (!title) return ""
	if (title.startsWith("i18n:")) {
		const I18N_KEY = title.slice(5)
		return t(I18N_KEY)
	}
	return title
}

/**
 * 开始加载
 */
const startLoading = () => {
	isLoading.value = true
	isOpen.value = false
}

/**
 * 停止加载
 */
const stopLoading = () => {
	isLoading.value = false
}

onMounted(() => {
	document.addEventListener("click", handleClickOutside)
})

onUnmounted(() => {
	document.removeEventListener("click", handleClickOutside)
})

defineExpose({
	startLoading,
	stopLoading
})
</script>

<template>
	<div class="selector" ref="selectorElement">
		<div
			class="selector-selected"
			:class="{'open-bottom': isOpen && dropdownDirection === 'bottom', 'open-top': isOpen && dropdownDirection === 'top', 'loading': showLoading}"
			@click="toggleList">
			<template v-if="!showLoading">
				<img
					class="images"
					:src="selectorSelected.images"
					:alt="getTitle(selectorSelected.title)"
					v-if="selectorSelected.images">
				<span class="selector-option">{{ getTitle(selectorSelected.title) }}</span>
			</template>
			<div v-else class="loading-indicator">
				<div class="loading-spinner"></div>
				<span>{{ t("components.Selector.loading") }}</span>
			</div>
		</div>
		<transition :name="dropdownDirection === 'bottom' ? 'slide-down' : 'slide-up'">
			<ul
				v-show="isOpen && !showLoading"
				class="selector-list"
				:class="{'dropdown-top': dropdownDirection === 'top', 'dropdown-bottom': dropdownDirection === 'bottom', 'has-scroll': selectorList && selectorList.length > num}"
				:style="{ 'max-height': `${num * 44}px` }">
				<li
					v-for="item in selectorList || []"
					:key="item[uniqueKey]"
					@click="selectItem(item)"
					:class="{ 'active': item[uniqueKey] === selectorSelected[uniqueKey] }">
					<img :src="item.images" class="images" :alt="getTitle(item.title)" v-if="item.images">
					<span class="lang-option">{{ getTitle(item.title) }}</span>
				</li>
			</ul>
		</transition>
	</div>
</template>

<style scoped lang="less">
.selector {
	position: relative;
	width: 100%;
	user-select: none;
}

.selector-selected {
	padding: 12px;
	height: 19px;
	border: 1px solid var(--border-color);
	display: flex;
	align-items: center;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.3s;
	background-color: var(--background-color);

	&:hover:not(.loading) {
		border-color: var(--theme-color);
		box-shadow: 0 2px 8px var(--box-shadow-color);
	}

	&.loading {
		cursor: default;
		opacity: 0.7;
	}
}

.open-bottom {
	border-radius: 8px 8px 0 0;
}

.open-top {
	border-radius: 0 0 8px 8px;
}

.loading-indicator {
	display: flex;
	align-items: center;
	width: 100%;

	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(0, 0, 0, 0.1);
		border-radius: 50%;
		border-top-color: var(--text-color);
		animation: spin 1s linear infinite;
		margin-right: 8px;
	}

	span {
		font-size: 14px;
		color: var(--text-color);
	}
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.selector-list {
	position: absolute;
	left: 0;
	right: 0;
	list-style: none;
	border: 1px solid var(--border-color);
	background-color: var(--background-color);
	z-index: 10;
	overflow: hidden;
	max-height: 132px;

	&.has-scroll {
		overflow-y: auto;
	}

	li {
		display: flex;
		align-items: center;
		padding: 12px;
		cursor: pointer;
		transition: background 0.2s;

		&:hover {
			background-color: var(--background-color-anti);
			color: var(--background-color);
		}
	}

	.active {
		background-color: var(--active-background-color-anti);
		color: #292A2DFF;

		&:hover {
			background-color: var(--active-background-color-anti);
			color: #292A2DFF;
		}
	}

	&.dropdown-bottom {
		top: 100%;
		border-radius: 0 0 8px 8px;
		border-top: none;
	}

	&.dropdown-top {
		bottom: 100%;
		border-radius: 8px 8px 0 0;
		border-bottom: none;
	}
}

.images {
	height: 18px;
	margin-right: 12px;
	border-radius: 2px;
	object-fit: cover;
}

.selector-option {
	font-size: 14px;
}

.slide-down-enter-active,
.slide-down-leave-active {
	transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
	opacity: 0;
	transform: translateY(-10px);
}

.slide-up-enter-active,
.slide-up-leave-active {
	transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
	opacity: 0;
	transform: translateY(10px);
}
</style>