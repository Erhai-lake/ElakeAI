<script>
import FoldingPanel from "@/components/FoldingPanel.vue";
import ThemeSelect from "@/components/ThemeSwitch.vue";
import LanguageSelect from "@/components/LanguageSelect.vue";
import ChatAIKey from "@/components/ChatsAIKey.vue";
import Button from "@/components/Button.vue";

export default {
    name: "DeBUGView",
    inject: ["$DB"],
    components: {Button, ChatAIKey, LanguageSelect, ThemeSelect, FoldingPanel},
    data() {
        return {
            toastOptions: {
                message: "测试",
                type: "success",
                position: "top",
                duration: 3000,
                dismissible: true
            },
            chats: [],
            configs: []
        }
    },
    created() {
        this.configsLoading()
        this.chatsLoading()
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
                console.error("[DeBUG View] Configs数据获取错误", error)
                this.$toast.error("[DeBUG View] Configs数据获取错误")
            }
        },
        // 清空Configs数据库数据
        async configsClear() {
            if (!confirm("确定要清空Configs数据库吗?")) return
            try {
                await this.$DB.Configs.clear()
                await this.configsLoading()
                this.$toast.success("Configs数据库已清空")
            } catch (error) {
                console.error("[DeBUG View] Configs数据清空错误", error)
                this.$toast.error("[DeBUG View] Configs数据清空错误")
            }
        },
        // 删除Configs数据
        async configsDelete(item) {
            if (!confirm("确定要删除Configs数据吗?")) return
            try {
                await this.$DB.Configs.delete(item)
                this.configs = this.configs.filter(config => config.item !== item)
                this.$toast.success("数据删除成功")
            } catch (error) {
                console.error("[DeBUG View] Configs数据删除错误", error)
                this.$toast.error("[DeBUG View] Configs数据删除错误")
            }
        },
        // 获取Chats数据库数据
        async chatsLoading() {
            try {
                this.chats = await this.$DB.Chats.toArray()
            } catch (error) {
                console.error("[DeBUG View] Chats数据获取错误", error)
                this.$toast.error("[DeBUG View] Chats数据获取错误")
            }
        },
        // 清空Chats数据库数据
        async chatsClear() {
            if (!confirm("确定要清空Chats数据库吗?")) return
            try {
                await this.$DB.Chats.clear()
                await this.chatsLoading()
                this.$toast.success("Chats数据库已清空")
            } catch (error) {
                console.error("[DeBUG View] Chats数据清空错误", error)
                this.$toast.error("[DeBUG View] Chats数据清空错误")
            }
        },
        // 删除Chats数据
        async chatsDelete(item) {
            if (!confirm("确定要删除Chats数据吗?")) return
            try {
                await this.$DB.Chats.delete(item)
                this.chats = this.chats.filter(chat => chat.key!== item)
                this.$toast.success("数据删除成功")
            } catch (error) {
                console.error("[DeBUG View] Chats数据删除错误", error)
                this.$toast.error("[DeBUG View] Chats数据删除错误")
            }
        },
        // 处理Title输入框
        async handleTitleBlur(item, event) {
            const NEW_VALUE = event.target.value.trim()
            if (NEW_VALUE === item.title) return
            try {
                await this.$DB.Chats.update(item.key, {title: NEW_VALUE})
                item.title = NEW_VALUE
                this.$toast.success("标题更新成功")
            } catch (error) {
                console.error("[DeBUG View] 标题更新错误", error)
                this.$toast.error("[DeBUG View] 标题更新错误")
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
                this.$toast.success("数据更新成功")
            } catch (error) {
                console.error("[DeBUG View] 数据更新错误", error)
                this.$toast.error("[DeBUG View] JSON格式错误")
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
                    <Button @click="chatsLoading">加载</Button>
                    <Button @click="chatsClear">清空</Button>
                </div>
                <table>
                    <thead>
                    <tr>
                        <th>key</th>
                        <th>title</th>
                        <th>data</th>
                        <th>Operation</th>
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
                        <td>
                            <Button @click="chatsDelete(item.key)">删除</Button>
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
                    <Button @click="configsLoading">加载</Button>
                    <Button @click="configsClear">清空</Button>
                </div>
                <table>
                    <thead>
                    <tr>
                        <th>item</th>
                        <th>Value</th>
                        <th>Operation</th>
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
                        <td>
                            <Button @click="configsDelete(item.item)">删除</Button>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </template>
        </FoldingPanel>
        <ChatAIKey/>
        <FoldingPanel Height="500">
            <template #Title>Toast</template>
            <template #Content>
                <div>
                    <label for="message">
                        提示信息
                        <input type="text" v-model="toastOptions.message" id="message" style="margin: 20px 0">
                    </label>
                    <br>
                    <label for="type">
                        提示类型
                        <select v-model="toastOptions.type" id="type">
                            <option value="success">成功</option>
                            <option value="error">错误</option>
                            <option value="info">信息</option>
                            <option value="warning">警告</option>
                        </select>
                    </label>
                    <br>
                    <br>
                    <label for="position">
                        提示位置
                        <select v-model="toastOptions.position">
                            <option value="top">顶部居中</option>
                            <option value="top-left">顶部左</option>
                            <option value="top-right">顶部右</option>
                            <option value="bottom">底部居中</option>
                            <option value="bottom-left">底部左</option>
                            <option value="bottom-right">底部右</option>
                        </select>
                    </label>
                    <br>
                    <label for="duration">
                        提示时间
                        <input type="number" v-model="toastOptions.duration" id="duration" style="margin: 20px 0">
                    </label>
                    <br>
                    <label for="dismissible">
                        鼠标点击是否可以关闭
                        <input type="checkbox" v-model="toastOptions.dismissible" id="dismissible"
                               style="margin: 20px 0">
                    </label>
                </div>
                <textarea v-text="toastOptions"/>
                <div>
                    <Button @click="toastTest(1)">清空</Button>
                    <Button @click="toastTest">提示</Button>
                </div>
            </template>
        </FoldingPanel>
    </div>
</template>

<style scoped lang="less">
.DeBUGContainer {
    padding: 20px;
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