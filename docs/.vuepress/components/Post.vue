<template>
  <div class="article">
    <!-- 添加摘要容器 -->
    <div v-if="summary" class="summary">
      <h3>AI 摘要</h3>
      <div v-html="summary"></div>
    </div>
    <div v-else class="loading">生成摘要中...</div>
    <!-- 文章内容, Content 是内置组件 -->
    <!-- <Content /> -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 使用ref管理响应式状态
const summary = ref(null);

// 生成摘要的方法
async function generateSummary() {
  try {
    // 获取文章纯文本内容（需根据实际结构调整选择器）
    const content = document.querySelector('.vp-page').innerText;
    const response = await fetch('https://how-browsers-work.vercel.app/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    const data = await response.json();
    console.log('response data', data);
    
    summary.value = data.summary.replace(/\n/g, '<br>'); // 换行处理
  } catch (error) {
    console.error('摘要生成失败:', error);
  }
}

// 组件挂载后执行
onMounted(() => {
  generateSummary();
})
</script>

<style>
.summary { background: #f8f9fa; padding: 1rem; border-radius: 8px; }
.loading { color: #666; font-style: italic; }
</style>