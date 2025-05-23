<script>
import {defineComponent} from "vue"

export default defineComponent({
    name: "ThemeSelect",
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
        const DB = new this.$DBOperation({
            toast: this.$toast,
            dbName: this.$DB_CONFIG.name,
            storeName: "Config"
        })
        this.Theme = await DB.get("Theme") ? (await DB.get("Theme")).Theme : "System"
    },
    methods: {
        /**
         * 应用主题
         * @param theme 主题名称
         */
        async applyTheme(theme) {
            if (!theme) return
            if (theme === "System") {
                document.documentElement.setAttribute("data-theme", window.matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "Light")
            } else {
                document.documentElement.setAttribute("data-theme", theme)
            }
            void document.body.offsetWidth
            // 保存设置
            const DB = new this.$DBOperation({
                dbName: this.$DB_CONFIG.name,
                storeName: "Config"
            })
            // 没有就add, 有就update
            if (await DB.get("Theme")) {
                await DB.update("Theme", {"Theme": theme})
            } else {
                await DB.add({"item": "Theme", "Theme": theme})
            }
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