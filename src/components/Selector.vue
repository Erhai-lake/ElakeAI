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
        }
    },
    data() {
        return {
            isOpen: false,
            dropdownDirection: "bottom"
        }
    },
    methods: {
        toggleList() {
            if (!this.isOpen) {
                this.calculateDropdownDirection()
            }
            this.isOpen = !this.isOpen
        },
        calculateDropdownDirection() {
            const DROPDOWN_HEIGHT = this.num * 44
            const DROPDOWN_RECT = this.$el.getBoundingClientRect()
            const DROPDOWN_BOTTOM = DROPDOWN_RECT.bottom + DROPDOWN_HEIGHT
            const WINDOW_HEIGHT = window.innerHeight
            this.dropdownDirection = DROPDOWN_BOTTOM > WINDOW_HEIGHT ? "top" : "bottom"
        },
        handleClickOutside(e) {
            if (!this.$el.contains(e.target)) {
                this.isOpen = false
            }
        },
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
    <div class="Selector" ref="selector">
        <div
            class="SelectorSelected"
            :class="{
                 'OpenBottom': isOpen && dropdownDirection === 'bottom',
                 'OpenTop': isOpen && dropdownDirection === 'top'
             }"
            @click="toggleList">
            <img class="Images"
                 :src="selectorSelected.images"
                 :alt="selectorSelected.title"
                 v-if="selectorSelected.images">
            <span class="SelectorOption">{{ selectorSelected.title }}</span>
        </div>
        <transition :name="dropdownDirection === 'bottom' ? 'slide-down' : 'slide-up'">
            <ul
                v-show="isOpen"
                class="SelectorList"
                :class="{
                    'DropdownTop': dropdownDirection === 'top',
                    'DropdownBottom': dropdownDirection === 'bottom',
                    'hasScroll': selectorList && selectorList.length > num
                }"
                :style="{ 'max-height': `${num * 44}px` }">
                <li
                    v-for="item in selectorList || []"
                    :key="item[uniqueKey]"
                    @click="selectItem(item)"
                    :class="{ 'Active': item[uniqueKey] === selectorSelected[uniqueKey] }">
                    <img :src="item.images" class="Images" :alt="item.title" v-if="item.images">
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
    padding: 12px;
    height: 19px;
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    background-color: var(--background-color);

    &:hover {
        border-color: #80ceff;
        box-shadow: 0 2px 8px var(--box-shadow-color);
    }
}

.OpenBottom {
    border-radius: 8px 8px 0 0;
}

.OpenTop {
    border-radius: 0 0 8px 8px;
}

.SelectorList {
    position: absolute;
    left: 0;
    right: 0;
    list-style: none;
    border: 1px solid var(--border-color);
    background-color: var(--background-color);
    z-index: 100;
    overflow: hidden;
    max-height: 132px;

    &.hasScroll {
        overflow-y: auto;
    }

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

    &.DropdownBottom {
        top: 100%;
        border-radius: 0 0 8px 8px;
        border-top: none;
    }

    &.DropdownTop {
        bottom: 100%;
        border-radius: 8px 8px 0 0;
        border-bottom: none;
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

//向下展开的动画
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

//向上展开的动画
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