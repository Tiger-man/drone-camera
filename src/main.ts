import { createApp } from 'vue'

import 'vant/es/toast/style';
import 'vant/es/dialog/style';
import 'vant/es/notify/style';
import 'vant/es/image-preview/style';

import App from './App.vue'

import './style.scss'
import { showNotify } from 'vant';

const app = createApp(App)

app.config.errorHandler = (err) => {
  // 处理错误
  // `info` 是 Vue 特定的错误信息，比如错误所在的生命周期钩子
  if (err instanceof Error) {
    showNotify(err.message)
  }
};

app.mount('#app')