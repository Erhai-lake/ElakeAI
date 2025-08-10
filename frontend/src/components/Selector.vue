<script>
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import EventBus from "@/services/EventBus";

export default {
	name: "Selector",
	props: {
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
	},
	data() {
		return {
			isOpen: false,
			dropdownDirection: "bottom",
			isLoading: false
		}
	},
	mounted() {
		document.addEventListener("click", this.handleClickOutside)
	},
	beforeUnmount() {
		document.removeEventListener("click", this.handleClickOutside)
	},
	computed: {
		showLoading() {
			return this.loading || this.isLoading
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
		},
		/**
		 * 切换列表
		 */
		toggleList() {
			if (this.showLoading) return
			if (!this.isOpen) {
				this.calculateDropdownDirection()
			}
			this.isOpen = !this.isOpen
		},
		/**
		 * 计算下拉框的方向
		 */
		calculateDropdownDirection() {
			const DROPDOWN_HEIGHT = this.num * 44
			const DROPDOWN_RECT = this.$el.getBoundingClientRect()
			const DROPDOWN_BOTTOM = DROPDOWN_RECT.bottom + DROPDOWN_HEIGHT
			const WINDOW_HEIGHT = window.innerHeight
			this.dropdownDirection = DROPDOWN_BOTTOM > WINDOW_HEIGHT ? "top" : "bottom"
		},
		/**
		 * 处理点击事件
		 * @param e {Event} - 事件对象
		 */
		handleClickOutside(e) {
			if (!this.$el.contains(e.target)) {
				this.isOpen = false
			}
		},
		/**
		 * 选择项
		 * @param item {Object} - 选择项
		 */
		selectItem(item) {
			if (this.showLoading) return
			this.isOpen = false
			this.$emit("update:selectorSelected", item)
		},
		/**
		 * 标题
		 * @param title {String} - 标题
		 * @returns {String} - 标题
		 */
		getTitle(title) {
			if (!title) return ""
			if (title.startsWith("i18n:")) {
				const I18N_KEY = title.slice(5)
				return this.t(I18N_KEY)
			}
			return title
		},
		/**
		 * 开始加载
		 */
		startLoading() {
			this.isLoading = true
			this.isOpen = false
		},
		/**
		 * 停止加载
		 */
		stopLoading() {
			this.isLoading = false
		}
	}
}
</script>

<template>
	<div class="selector">
		<div
			class="selector-selected"
			:class="{'open-bottom': isOpen && dropdownDirection === 'bottom', 'open-top': isOpen && dropdownDirection === 'top', 'loading': showLoading}"
			@click="toggleList">
			<template v-if="!showLoading">
				<img class="images" :src="selectorSelected.images" :alt="getTitle(selectorSelected.title)"
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
		border-color: #80ceff;
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
		background-color: var(--Active-Background-Color-anti);
		color: #292A2DFF;

		&:hover {
			background-color: var(--Active-Background-Color-anti);
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