# elake_ai

## 提示

https://github.com/ankurk91/vue-toast-notification

```js
// 使用
let instance = this.$toast.open({
    message: 'You did it!'
})
// 关闭
instance.dismiss()
// 清空所有toast
this.$toast.clear()
```

| 属性           |    类型    |       默认       | 描述                                                                          |
|:-------------|:--------:|:--------------:|:----------------------------------------------------------------------------|
| message      |  String  |       --       | 消息文本/html(必需)                                                               |
| type         |  String  |   `success`    | `success`, `info`, `warning`, `error`, `default`中的一个                        |
| position     |  String  | `bottom-right` | `top`, `bottom`, `top-right`, `bottom-right`, `top-left`, `bottom-left`中的一个 |
| duration     |  Number  |     `3000`     | 可见持续时间(毫秒), 设置为 0 以保持 toast 可见                                              |
| dismissible  | Boolean  |     `true`     | 允许用户通过点击关闭                                                                  |
| onClick      | Function |       --       | 用户点击时执行操作                                                                   |
| onDismiss    | Function |       --       | Toast 被关闭后执行操作                                                              |
| queue        | Boolean  |    `false`     | 等待现有的 toast 消失后再显示新的                                                        |
| pauseOnHover | Boolean  |     `true`     | 鼠标悬停在 toast 上时暂停计时器                                                         |