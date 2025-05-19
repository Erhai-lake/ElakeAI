<script>
import {defineComponent, ref, onMounted, onUnmounted} from 'vue';

export default defineComponent({
    name: "AIInput",
    setup() {
        const textareaRef = ref(null)
        const adjustTextareaHeight = () => {
            if (!textareaRef.value) return
            textareaRef.value.style.height = 'auto'
            const newHeight = Math.min(textareaRef.value.scrollHeight, 600)
            textareaRef.value.style.height = `${Math.max(newHeight, 50)}px`
        }
        onMounted(() => {
            if (textareaRef.value) {
                adjustTextareaHeight()
                textareaRef.value.addEventListener('input', adjustTextareaHeight)
            }
        })
        onUnmounted(() => {
            if (textareaRef.value) {
                textareaRef.value.removeEventListener('input', adjustTextareaHeight);
            }
        })
        return {textareaRef}
    }
})
</script>

<template>
    <div class="AIInput">
        <!--附件栏-->
        <input id="Appendix" type="checkbox"/>
        <div class="AppendixBar">
            <!--关闭-->
            <label for="Appendix">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Close"></use>
                </svg>
            </label>
            <!--拍照-->
            <label for="Camera">
                <input type="file" id="Camera" accept="image/*" capture="environment"/>
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Photograph"></use>
                </svg>
            </label>
            <!--相册-->
            <label for="Photos">
                <input type="file" id="Photos" accept="image/*"/>
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-PhotoAlbum"></use>
                </svg>
            </label>
            <!--文件-->
            <label for="Files">
                <input type="file" id="Files"/>
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-File"></use>
                </svg>
            </label>
        </div>
        <!--聊天输入框-->
        <textarea id="ChatInput" placeholder="想问点什么?" ref="textareaRef"></textarea>
        <!--按钮栏-->
        <div class="ButtonBar">
            <!--附件-->
            <label for="Appendix">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Link"></use>
                </svg>
            </label>
            <!--联网搜索-->
            <input id="Search" type="checkbox"/>
            <label for="Search">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Networking"></use>
                </svg>
            </label>
            <div></div>
            <!--发送-->
            <label for="Send" class="Send">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Send"></use>
                </svg>
            </label>
        </div>
    </div>
</template>

<style scoped lang="less">
.icon {
    width: 2em;
    height: 2em;
    vertical-align: -0.15em;
    fill: currentColor;
    overflow: hidden;
}

@media screen and (max-width: 768px) {
    .AIInput {
        width: 100% !important;
    }
}

.AIInput {
    position: relative;
    padding: 16px;
    margin: 0 10px;
    width: 50%;
    border: 2px solid var(--border-color);
    border-radius: 15px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .ButtonBar {
        padding: 5px;
        width: 100%;
        display: grid;
        grid-template-columns: auto auto 1fr auto;
        gap: 10px;
        overflow-x: auto;

        label {
            padding: 10px;
            font-size: 12px;
            border-radius: 50%;
            border: 2px solid var(--chat-input-button-border-color);
            cursor: pointer;
            outline: none;
            transition: all 0.2s ease-in-out, transform 0.1s ease-in-out;

            &:hover {
                box-shadow: 0 0 5px 3px var(--chat-input-button-hover-shadow-color);
            }

            &:active {
                transform: scale(0.9);
            }
        }

        .Send {
            background-color: var(--chat-input-button-send-background-color);
        }
    }
}


#Appendix, #Camera, #Photos, #Files, #Search {
    display: none;
}

#ChatInput {
    width: 100%;
    min-height: 50px;
    max-height: 600px;
    color: var(--text-color);
    font-size: 16px;
    letter-spacing: 3px;
    background: none;
    border: none;
    resize: none;

    &:focus {
        outline: none;
    }
}


.AppendixBar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    border-radius: 16px;
    overflow: hidden;
    pointer-events: none;
    transition: all 0.2s 0.4s ease-in-out;

    label {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 16px;
        border-radius: 50%;
        border: 2px solid var(--chat-input-attachment-button-border-color);
        font-size: 14px;
        color: var(--chat-input-attachment-button-text-color);
        background-color: var(--chat-input-attachment-button-background-color);
        opacity: 0;
        transition: all 0.2s ease-in-out;
        transform: translate(-600%, 600%);
        cursor: pointer;
    }

    & :nth-child(1) {
        transition-delay: 0.1s;
    }

    & :nth-child(2) {
        transition-delay: 0.2s;
    }

    & :nth-child(3) {
        transition-delay: 0.3s;
    }

    & :nth-child(4) {
        transition-delay: 0.4s;
    }
}

#Appendix {
    &:checked ~ .AppendixBar {
        background-color: var(--scrollbar-thumb-hover-color);
        backdrop-filter: blur(5px);
        pointer-events: all;
        transition: all 0.2s ease-in-out;

        label {
            opacity: 1;
            transform: translate(0);
        }
    }
}

#Search {
    &:checked + label {
        border: 2px solid lightskyblue;
        color: lightskyblue;
    }
}
</style>