<script>
import FoldingPanel from "@/components/FoldingPanel.vue";
import ThemeSelect from "@/components/ThemeSwitch.vue";
import LanguageSelect from "@/components/LanguageSelect.vue";

export default {
    name: "DeBUG",
    inject: ["$DB"],
    components: {LanguageSelect, ThemeSelect, FoldingPanel},
    data() {
        return {
            toastOptions: {
                message: "",
                type: "success",
                position: "top",
                duration: 3000,
                dismissible: true
            },
            chats: [],
            configs: []
        }
    },
    methods: {
        // Configs特殊处理
        Special(item) {
            switch (item) {
                case "Theme":
                    return false
                case "Language":
                    return false
                default:
                    return true
            }
        },
        // 获取Configs数据库数据
        async configsLoading() {
            try {
                this.configs = await this.$DB.Configs.toArray()
            } catch (error) {
                console.error("[DeBUG] Configs数据获取错误", error)
                this.$toast.error("[DeBUG] Configs数据获取错误")
            }
        },
        // 清空Configs数据库数据
        async configsClear() {
            if (!confirm("确定要清空Configs数据库吗?")) return
            try {
                await this.$DB.Configs.clear()
                this.$toast.success("[DeBUG] 数据库已清空")
            } catch (error) {
                console.error("[DeBUG] Configs数据清空错误", error)
                this.$toast.error("[DeBUG] Configs数据清空错误")
            }
        },
        // 获取Chats数据库数据
        async chatsLoading() {
            try {
                this.chats = await this.$DB.Chats.toArray()
            } catch (error) {
                console.error("[DeBUG] Chats数据获取错误", error)
                this.$toast.error("[DeBUG] Chats数据获取错误")
            }
        },
        // 清空Chats数据库数据
        async chatsClear() {
            if (!confirm("确定要清空Chats数据库吗?")) return
            try {
                await this.$DB.Chats.clear()
                this.$toast.success("[DeBUG] Chats数据库已清空")
            } catch (error) {
                console.error("[DeBUG] Chats数据清空错误", error)
                this.$toast.error("[DeBUG] Chats数据清空错误")
            }
        },
        // 处理Title输入框
        async handleTitleBlur(item, event) {
            const NEW_VALUE = event.target.value.trim()
            if (NEW_VALUE === item.title) return
            try {
                await this.$DB.Chats.update(item.key, {title: NEW_VALUE})
                item.title = NEW_VALUE
                this.$toast.success("[DeBUG] 标题更新成功")
            } catch (error) {
                console.error("[DeBUG] 标题更新错误", error)
                this.$toast.error("[DeBUG] 标题更新错误")
                event.target.value = item.title
            }
        },
        // 处理Data输入框
        async handleDataBlur(item, event) {
            const RAW_VALUE = event.target.value.trim()
            if (RAW_VALUE === JSON.stringify(item.data, null)) return
            try {
                const parsedData = JSON.parse(RAW_VALUE)
                await this.$DB.Chats.update(item.key, {data: parsedData})
                item.data = JSON.parse(JSON.stringify(parsedData))
                this.$toast.success("[DeBUG] 数据更新成功")
            } catch (error) {
                console.error("[DeBUG] 数据更新错误", error)
                this.$toast.error("[DeBUG] JSON格式错误")
                event.target.value = JSON.stringify(item.data, null)
            }
        },
        // toast测试
        toastTest(id) {
            if (id === 1) {
                this.$toast.clear()
            } else {
                this.$toast.open(this.toastOptions)
            }
        }
    }
}
</script>

<template>
    <div class="DeBUGContainer">
        <FoldingPanel>
            <template #Title>Chats数据库</template>
            <template #Content>
                <div>
                    <button @click="chatsLoading">加载</button>
                    <button @click="chatsClear">清空</button>
                </div>
                <table>
                    <thead>
                    <tr>
                        <th>key</th>
                        <th>title</th>
                        <th>data</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(item, index) in chats" :key="index">
                        <td>{{ item.key }}</td>
                        <td>
                            <input
                                type="text"
                                style="width: 100%;"
                                :value="item.title"
                                @blur="handleTitleBlur(item, $event)">
                        </td>
                        <td>
                            <input
                                type="text"
                                style="width: 100%;"
                                :value="JSON.stringify(item.data, null)"
                                @blur="handleDataBlur(item, $event)">
                        </td>
                    </tr>
                    </tbody>
                </table>
            </template>
        </FoldingPanel>
        <FoldingPanel>
            <template #Title>Configs数据库</template>
            <template #Content>
                <div>
                    <button @click="configsLoading">加载</button>
                    <button @click="configsClear">清空</button>
                </div>
                <table>
                    <thead>
                    <tr>
                        <th>item</th>
                        <th>Value</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(item, index) in configs" :key="index">
                        <td>{{ item.item }}</td>
                        <td class="Value" v-if="Special(item.item)">
                            <input type="text" :name="item.item" :value="item.value">
                        </td>
                        <td class="Value" v-if="item.item === 'Theme'">
                            <ThemeSelect/>
                        </td>
                        <td class="Value" v-if="item.item === 'Language'">
                            <LanguageSelect/>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </template>
        </FoldingPanel>
        <FoldingPanel>
            <template #Title>Toast</template>
            <template #Content>
                <div>
                    <input type="text" v-model="toastOptions.message" style="margin: 20px 0">
                    <select v-model="toastOptions.type">
                        <option value="success">成功</option>
                        <option value="error">错误</option>
                        <option value="info">信息</option>
                        <option value="warning">警告</option>
                    </select>
                    <select v-model="toastOptions.position">
                        <option value="top">顶部居中</option>
                        <option value="top-left">顶部左</option>
                        <option value="top-right">顶部右</option>
                        <option value="bottom">底部居中</option>
                        <option value="bottom-left">底部左</option>
                        <option value="bottom-right">底部右</option>
                    </select>
                    <input type="number" v-model="toastOptions.duration" style="margin: 20px 0">
                    <label for="dismissible">
                        鼠标点击是否可以关闭
                        <input type="checkbox" v-model="toastOptions.dismissible" id="dismissible"
                               style="margin: 20px 0">
                    </label>
                </div>
                <textarea v-text="toastOptions"/>
                <div>
                    <button @click="toastTest(1)">清空</button>
                    <button @click="toastTest">提示</button>
                </div>
            </template>
        </FoldingPanel>
    </div>
</template>

<style scoped lang="less">
.DeBUGContainer {
    padding: 20px;
}

button {
    padding: 10px 30px;
    margin: 10px;
    background-color: var(--button-background-color);
    color: var(--text-color);
    border: 1px solid #909399FF;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    user-select: none;
    transition: all 0.15s;

    &:hover {
        background-color: var(--button-hover-background-color);
    }

    &:active {
        background-color: var(--button-active-background-color);
    }
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    text-align: center;

    th, td {
        border: 1px solid var(--border-color);
    }

    .Value {
        padding: 10px;
        display: flex;
        align-items: center;
        justify-content: center;

        input {
            text-align: center;
        }
    }
}

textarea {
    width: 100%;
    height: 150px;
    border: none;
    resize: none;
}
</style>