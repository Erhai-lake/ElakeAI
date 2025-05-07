<template>
    <!--    <HomeSidebar>-->
    <!--        <template #SidebarConversationList>-->
    <!--            SidebarConversationList-->
    <!--        </template>-->
    <!--    </HomeSidebar>-->
    <HomeSidebar/>
    <!--  <nav>-->
    <!--    <router-link to="/">Home</router-link>-->
    <!--  </nav>-->
    <!--  <router-view/>-->
</template>

<style lang="less">
* {
    margin: 0;
    padding: 0;
    transition: all 0.3s ease-in-out;
}

#app {
    width: 100%;
    height: 100vh;
    display: flex;
}

//全局滚动条
::-webkit-scrollbar {
    //垂直滚动条宽度
    width: 10px;
    //水平滚动条高度
    height: 10px;
}

/* 滚动条轨道 */
::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 50%);
    border-radius: 4px;
}

/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
    background: rgba(193, 193, 193, 60%);
    border-radius: 4px;
}

/* 滚动条滑块悬停状态 */
::-webkit-scrollbar-thumb:hover {
    background: rgba(168, 168, 168, 0.78);
}
</style>
<script setup lang="ts">
import HomeSidebar from "@/components/HomeSidebar.vue";
</script>