<script>
export default {
    name: "Selector",
    props: {
        selectorSelected: {
            type: Object,
            required: true
        },
        selectorList: {
            type: Array,
            required: true
        },
        uniqueKey: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            isOpen: false
        }
    },
    methods: {
        // 切换下拉列表
        toggleList() {
            this.isOpen = !this.isOpen
        },
        // 点击外部关闭下拉列表
        handleClickOutside(e) {
            if (!this.$el.contains(e.target)) {
                this.isOpen = false
            }
        },
        // 选择选项时触发事件
        selectItem(item) {
            this.isOpen = false
            this.$emit('update:selectorSelected', item)
        }
    },
    mounted() {
        document.addEventListener("click", this.handleClickOutside)
    },
    beforeDestroy() {
        document.removeEventListener("click", this.handleClickOutside)
    }
}
</script>

<template>
    <div class="Selector">
        <div class="SelectorSelected" :class="{ 'Open': isOpen }" @click="toggleList">
            <img class="Images" :src="selectorSelected.images" :alt="selectorSelected.title">
            <span class="SelectorOption">{{ selectorSelected.title }}</span>
        </div>
        <transition name="slide">
            <ul v-show="isOpen" class="SelectorList">
                <li
                    v-for="item in selectorList"
                    :key="item[uniqueKey]"
                    @click="selectItem(item)"
                    :class="{ 'Active': item[uniqueKey] === selectorSelected[uniqueKey] }">
                    <img :src="item.images" class="Images" :alt="item.title">
                    <span class="LangOption">{{ item.title }}</span>
                </li>
            </ul>
        </transition>
    </div>
</template>

<style scoped lang="less">
.Selector {
    position: relative;
    width: 100%;
    user-select: none;
}

.SelectorSelected {
    display: flex;
    align-items: center;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    background-color: var(--background-color);

    &:hover {
        border-color: #80ceff;
        box-shadow: 0 2px 8px var(--box-shadow-color);
    }
}

.Open {
    border-radius: 8px 8px 0 0;
}

.SelectorList {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    list-style: none;
    border: 1px solid var(--border-color);
    border-top: none;
    border-radius: 0 0 8px 8px;
    background-color: var(--background-color);
    z-index: 100;
    overflow: hidden;

    li {
        display: flex;
        align-items: center;
        padding: 12px;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
            background-color: var(--background-color-Anti);
            color: var(--background-color);
        }
    }

    .Active {
        --Active-Background-Color: rgba(189, 229, 255, 0.5);
        background-color: var(--Active-Background-Color);
        color: #292A2DFF;

        &:hover {
            background-color: var(--Active-Background-Color);
            color: #292A2DFF;
        }
    }
}

.Images {
    width: 24px;
    height: 18px;
    margin-right: 12px;
    border-radius: 2px;
    object-fit: cover;
}

.SelectorOption {
    font-size: 14px;
}

.slide-enter-active,
.slide-leave-active {
    transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>