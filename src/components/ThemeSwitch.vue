<script>
import {defineComponent} from "vue"
import {useStore} from "vuex"

export default defineComponent({
    name: "ThemeSelect",
    data() {
        return {
            Theme: "",
        }
    },
    setup() {
        const store = useStore()
        return {store}
    },
    watch: {
        // 监听主题变化
        Theme(newVal) {
            if (newVal === "System") {
                this.applyTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "LIGHT")
            } else {
                this.applyTheme(newVal)
            }
        }
    },
    created() {
        this.Theme = this.store.getters.currentTheme
    },
    methods: {
        /**
         * 应用主题
         * @param theme 主题名称
         */
        applyTheme(theme) {
            if (!theme) return
            this.store.dispatch("switchTheme", theme)
            document.documentElement.setAttribute("data-theme", theme)
            void document.body.offsetWidth
        }
    }
})
</script>

<template>
    <div class="Switch">
        <input type="radio" id="Light" name="Theme" value="Light" v-model="Theme"/>
        <label for="Light">
            {{ $t("ThemeSwitch.LIGHT") }}
        </label>
        <input type="radio" id="System" name="Theme" value="System" v-model="Theme"/>
        <label for="System">
            {{ $t("ThemeSwitch.SYSTEM") }}
        </label>
        <input type="radio" id="Dark" name="Theme" value="Dark" v-model="Theme"/>
        <label for="Dark">
            {{ $t("ThemeSwitch.DARK") }}
        </label>
        <div class="Mask"></div>
    </div>
</template>

<style scoped lang="less">
.Switch {
    position: relative;
    padding: 10px 0;
    background-color: var(--background-color);
    border-radius: 50px;
    display: flex;
    overflow: hidden;

    .Mask {
        position: absolute;
        top: 0;
        left: 0;
        width: 80px;
        height: 100%;
        background-color: rgba(179, 179, 179, 0.6);
    }

    label {
        width: 80px;
        text-align: center;
        font-size: 14px;
    }

    input {
        display: none;
    }
}

#Light:checked {
    ~ .Mask {
        transform: translateX(0);
    }
}

#System:checked {
    ~ .Mask {
        transform: translateX(80px);
    }
}

#Dark:checked {
    ~ .Mask {
        transform: translateX(160px);
    }
}
</style>