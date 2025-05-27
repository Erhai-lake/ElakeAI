<script>
import {defineComponent} from "vue"

export default defineComponent({
    name: "ThemeSelect",
    inject: ["$DB"],
    data() {
        return {
            Theme: "",
        }
    },
    watch: {
        // 监听主题变化
        Theme(newVal) {
            this.applyTheme(newVal)
        }
    },
    async created() {
        // 获取主题
        try {
            const THEME_DATA = await this.$DB.Configs.get("Theme")
            this.Theme = THEME_DATA ? THEME_DATA.value : "System"
        } catch (error) {
            console.error("[Theme Switch] 主题获取错误", error)
            this.$toast.error("[Theme Switch] 主题获取错误")
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
                if (await this.$DB.Configs.get("Theme")) {
                    await this.$DB.Configs.put({
                        item: "Theme",
                        value: theme
                    })
                } else {
                    await this.$DB.Configs.add({
                        item: "Theme",
                        value: theme
                    })
                }
            } catch (error) {
                console.error("[Theme Switch] 主题应用错误", error)
                this.$toast.error("[Theme Switch] 主题应用错误")
            }
        }
    }
})
</script>

<template>
    <div class="Switch">
        <input type="radio" id="Light" name="Theme" value="Light" v-model="Theme"/>
        <label for="Light">
            {{ $t("components.ThemeSwitch.light") }}
        </label>
        <input type="radio" id="System" name="Theme" value="System" v-model="Theme"/>
        <label for="System">
            {{ $t("components.ThemeSwitch.system") }}
        </label>
        <input type="radio" id="Dark" name="Theme" value="Dark" v-model="Theme"/>
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