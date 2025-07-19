/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-07-20 02:24:33
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-07-20 02:32:11
 * @FilePath: \city_collect\packages\frontend\src\main.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import './style.css'


const app = createApp(App)

app.use(ElementPlus)
app.mount('#app')
