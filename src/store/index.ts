import {createStore} from 'vuex'

export default createStore({
    state: {
        // 默认白昼
        theme: localStorage.getItem('user-theme') || 'light'
    },
    getters: {
        // 获取当前主题
        currentTheme: (state: { theme: string }) => state.theme
    },
    mutations: {
        // 设置主题
        SET_THEME(state: { theme: string }, theme): void {
            state.theme = theme
            localStorage.setItem('user-theme', theme)
        }
    },
    actions: {
        // 切换主题
        switchTheme({commit}, theme): void {
            commit('SET_THEME', theme)
        }
    },
    modules: {}
})
