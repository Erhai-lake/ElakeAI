<script setup>
import {ref, onMounted, onUnmounted, nextTick} from "vue"
import EventBus from "@/services/EventBus"
import SVGIcon from "@/components/SVGIcon.vue"

/**
 * 右键菜单是否可见
 */
const visible = ref(false)

/**
 * 右键菜单位置
 */
const position = ref({x: 0, y: 0})

/**
 * 右键菜单列表
 */
const items = ref([])

/**
 * 右键菜单上下文键值
 */
const contextKey = ref(null)

/**
 * 处理其他右键菜单打开事件
 * @param event 事件对象
 */
const handleOtherMenuOpen = (event) => {
	// 如果不是自己触发的, 关闭自己
	if (event.detail !== instance) {
		hide()
	}
}

/**
 * 显示右键菜单
 * @param x 菜单显示的横坐标
 * @param y 菜单显示的纵坐标
 * @param menuItems 菜单列表
 * @param key 上下文键值
 */
const show = (x, y, menuItems, key) => {
	// 通知全局关闭其他菜单
	EventBus.emit("right-click-menu-open", {detail: instance})
	// 先隐藏
	hide()
	// 等视图更新后再显示
	nextTick(() => {
		position.value = {x, y}
		items.value = menuItems
		contextKey.value = key
		visible.value = true
		document.addEventListener("click", hide)
	})
}

/**
 * 隐藏右键菜单
 */
const hide = () => {
	visible.value = false
	document.removeEventListener("click", hide)
}

/**
 * 处理菜单点击事件
 * @param item 点击的菜单项
 */
const handleClick = (item) => {
	if (typeof item.onClick === "function") {
		item.onClick(contextKey.value)
	}
	hide()
}

let instance

onMounted(() => {
	instance = {
		show,
		hide
	}
	EventBus.on("right-click-menu-open", handleOtherMenuOpen)
})

onUnmounted(() => {
	EventBus.off("right-click-menu-open", handleOtherMenuOpen)
	document.removeEventListener("click", hide)
})

defineExpose({
	show,
	hide
})
</script>

<template>
	<transition name="fade">
		<div
			v-if="visible"
			class="right-click-menu"
			:style="{ top: position.y + 'px', left: position.x + 'px' }"
			@click.stop>
			<div
				v-for="(item, index) in items"
				:key="index"
				class="menu-item"
				:style="{ color: item.color}"
				@click="handleClick(item)">
				<SVGIcon :name="item.icon.src" v-if=" item.icon && item.icon.type === 'svg'"/>
				<img v-else-if="item.icon && item.icon.type === 'img'" :src="item.icon" :alt="item.title" class="icon"/>
				<span>{{ item.title }}</span>
			</div>
		</div>
	</transition>
</template>

<style scoped lang="less">
.fade-enter-active, .fade-leave-active {
	transition: opacity 0.15s ease;
}

.fade-enter-from, .fade-leave-to {
	opacity: 0;
}

.right-click-menu {
	padding: 4px 0;
	position: fixed;
	background-color: var(--right-click-menu-background-color);
	border: 1px solid var(--border-color);
	border-radius: 6px;
	box-shadow: 0 2px 8px var(--box-shadow-color);
	z-index: 9999;
}

.menu-item {
	padding: 6px 12px;
	color: var(--text-color);
	display: flex;
	align-items: center;
	cursor: pointer;
	transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;

	&:hover {
		background-color: var(--right-click-menu-background-color-anti);
		color: var(--text-color-anti);
	}
}

.icon {
	margin-right: 8px;
}
</style>