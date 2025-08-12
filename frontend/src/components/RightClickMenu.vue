<script>
import EventBus from "@/services/EventBus"

export default {
	name: "RightClickMenu",
	data() {
		return {
			visible: false,
			position: {x: 0, y: 0},
			items: [],
			contextKey: null
		};
	},
	beforeUnmount() {
		EventBus.off("right-click-menu-open", this.handleOtherMenuOpen)
	},
	created() {
		EventBus.on("right-click-menu-open", this.handleOtherMenuOpen)
	},
	methods: {
		/**
		 * 处理其他右键菜单打开事件
		 * @param event 事件对象
		 */
		handleOtherMenuOpen(event) {
			// 如果不是自己触发的, 关闭自己
			if (event.detail !== this) {
				this.hide()
			}
		},
		/**
		 * 显示右键菜单
		 * @param x 菜单显示的横坐标
		 * @param y 菜单显示的纵坐标
		 * @param menuItems 菜单列表
		 * @param key 上下文键值
		 */
		show(x, y, menuItems, key) {
			// 通知全局关闭其他菜单
			EventBus.emit("right-click-menu-open", this)
			// 先隐藏
			this.hide()
			// 等视图更新后再显示
			this.$nextTick(() => {
				this.position = {x, y}
				this.items = menuItems
				this.contextKey = key
				this.visible = true
				document.addEventListener("click", this.hide)
			})
		},
		/**
		 * 隐藏右键菜单
		 */
		hide() {
			this.visible = false
			document.removeEventListener("click", this.hide)
		},
		/**
		 * 处理菜单点击事件
		 * @param item 点击的菜单项
		 */
		handleClick(item) {
			if (typeof item.onClick === "function") {
				item.onClick(this.contextKey)
			}
			this.hide()
		}
	}
}
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
				<svg v-if=" item.icon && item.icon.type === 'svg'" class="icon" aria-hidden="true">
					<use :xlink:href="item.icon.src"></use>
				</svg>
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

	&:hover {
		background-color: var(--right-click-menu-background-color-anti);
		color: var(--text-color-anti);
	}
}

.icon {
	width: 16px;
	height: 16px;
	margin-right: 8px;
	vertical-align: -0.15em;
	fill: currentColor;
	overflow: hidden;
}
</style>