<script>
import {defineComponent} from "vue"

export default defineComponent({
    name: "ThemeSelect",
    inject: ["$DB"],
    data() {
        return {
			theme: "",
        }
    },
    watch: {
        // 监听主题变化
		theme(newVal) {
            this.applyTheme(newVal)
        }
    },
    async created() {
        // 获取主题
        try {
            const THEME_DATA = await this.$DB.configs.get("theme")
            this.Theme = THEME_DATA ? THEME_DATA.value : "System"
        } catch (error) {
            this.$log.error(`[${this.name}] 主题获取失败`, error)
            this.$toast.error(`[${this.name}] ${this.$t("components.ThemeSwitch.toast.getThemeError")}`)
        }
    },
    methods: {
        /**
         * 应用主题
         * @param theme 主题名称
         */
        async applyTheme(theme) {
            try {
                if (!theme) return
                if (theme === "System") {
                    document.documentElement.setAttribute("data-theme", window.matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "Light")
                } else {
                    document.documentElement.setAttribute("data-theme", theme)
                }
                void document.body.offsetWidth
                // 保存设置
                if (await this.$DB.configs.get("theme")) {
                    await this.$DB.configs.put({
                        item: "theme",
                        value: theme
                    })
                } else {
                    await this.$DB.configs.add({
                        item: "theme",
                        value: theme
                    })
                }
            } catch (error) {
                this.$log.error(`[${this.name}] 主题应用失败`, error)
                this.$toast.error(`[${this.name}] ${this.$t("components.ThemeSwitch.toast.applicationThemeError")}`)
            }
        }
    }
})
</script>

<template>
    <div class="Switch">
        <input type="radio" id="Light" name="theme" value="Light" v-model="theme"/>
        <label for="Light">
            {{ $t("components.ThemeSwitch.light") }}
        </label>
        <input type="radio" id="System" name="theme" value="System" v-model="theme"/>
        <label for="System">
            {{ $t("components.ThemeSwitch.system") }}
        </label>
        <input type="radio" id="Dark" name="theme" value="Dark" v-model="theme"/>
        <label for="Dark">
            {{ $t("components.ThemeSwitch.dark") }}
        </label>
        <div class="Mask"></div>
    </div>
</template>

<style scoped lang="less">
.Switch {
    position: relative;
    width: 240px;
    border-radius: 50px;
    border: 1px solid var(--border-color);
    background-color: var(--background-color);
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
        padding: 10px 0;
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