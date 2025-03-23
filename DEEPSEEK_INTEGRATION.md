# Vuepress项目接入DeepSeek API指南

本文档介绍如何在Vuepress静态网站项目中接入DeepSeek API，通过Vercel Serverless函数作为代理实现API调用。

## 背景

由于Vuepress生成的是静态网站，无法直接在前端安全地调用需要API密钥的服务。为解决这个问题，我们使用Vercel的Serverless函数作为中间层，代理API请求到DeepSeek服务。

## 实现架构

```
前端静态页面 -> Vercel Serverless函数 -> DeepSeek API
```

## 步骤一：创建Serverless函数

1. 在项目根目录创建`api`文件夹（如果尚未创建）
2. 在`api`文件夹中创建`summarize.js`文件，实现代理逻辑

```javascript
// api/summarize.js
export default async (req, res) => {
  // CORS配置
  const allowedOrigins = ["http://localhost:8080", "https://你的域名.github.io"];
  const origin = req.headers.origin;
  const isOriginAllowed = allowedOrigins.includes(origin);

  // 设置CORS头
  const setCorsHeaders = () => {
    res.setHeader("Access-Control-Allow-Origin", isOriginAllowed ? origin : "");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  };

  // 处理OPTIONS预检请求
  if (req.method === "OPTIONS") {
    setCorsHeaders();
    return res.status(200).end();
  }

  // 处理POST请求
  if (req.method === "POST") {
    try {
      // 验证来源
      if (!isOriginAllowed) {
        setCorsHeaders();
        return res.status(403).json({ error: "非法来源" });
      }

      // 解析请求体
      const { content } = req.body;
      if (!content || content.length > 30000) {
        setCorsHeaders();
        return res.status(400).json({ error: "无效内容" });
      }

      // 调用DeepSeek API
      const apiResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "user",
              content: `用中文总结以下技术内容：\n\n${content.slice(0, 3000)}`
            }
          ]
        })
      });
      
      if (!apiResponse.ok) throw new Error("API调用失败");
      const { choices } = await apiResponse.json();
      const summary = choices[0].message.content.replace(/\n/g, "<br>");

      // 成功响应
      setCorsHeaders();
      return res.status(200).json({ summary });
    } catch (error) {
      // 错误响应
      console.error("Error:", error);
      setCorsHeaders();
      return res.status(500).json({ error: "摘要生成失败" });
    }
  }

  // 其他请求方法处理
  setCorsHeaders();
  return res.status(405).json({ error: "不允许的请求方法" });
};
```

## 步骤二：部署到Vercel

1. 安装Vercel CLI（如果尚未安装）
```bash
npm install -g vercel
```

2. 登录Vercel
```bash
vercel login
```

3. 在项目根目录创建`vercel.json`配置文件
```json
{
  "version": 2,
  "builds": [
    { "src": "api/**/*.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" }
  ]
}
```

4. 部署到Vercel
```bash
vercel
```

5. 设置环境变量
   - 在Vercel控制台中找到你的项目
   - 进入项目设置 > 环境变量
   - 添加`DEEPSEEK_API_KEY`环境变量，值为你的DeepSeek API密钥

## 步骤三：在前端调用API

在Vuepress组件中添加调用代码示例：

```vue
<template>
  <div class="content-summarizer">
    <button @click="summarizeContent" :disabled="loading">生成摘要</button>
    <div v-if="loading" class="loading">正在生成摘要...</div>
    <div v-if="summary" class="summary" v-html="summary"></div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      summary: '',
      error: ''
    }
  },
  methods: {
    async summarizeContent() {
      this.loading = true;
      this.error = '';
      this.summary = '';
      
      try {
        // 获取当前页面内容
        const content = document.querySelector('.theme-default-content').textContent;
        
        // 调用Serverless函数
        const response = await fetch('https://你的vercel域名.vercel.app/api/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          this.summary = data.summary;
        } else {
          this.error = data.error || '生成摘要失败';
        }
      } catch (error) {
        this.error = '请求失败，请稍后再试';
        console.error(error);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.content-summarizer {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #eaecef;
  border-radius: 4px;
}

.loading {
  margin-top: 10px;
  color: #666;
}

.summary {
  margin-top: 15px;
  padding: 10px;
  background-color: #f8f8f8;
  border-left: 4px solid #42b983;
}

.error {
  margin-top: 10px;
  color: #f56c6c;
}
</style>
```

## 步骤四：在Vuepress中注册组件

1. 将上述组件保存为`ContentSummarizer.vue`，放在`docs/.vuepress/components/`目录下

2. 在Vuepress配置中注册组件（如果使用的是Vuepress 2.x）

```javascript
// docs/.vuepress/config.js
import { registerComponentsPlugin } from '@vuepress/plugin-register-components'
import { path } from '@vuepress/utils'

export default {
  // 其他配置...
  plugins: [
    registerComponentsPlugin({
      componentsDir: path.resolve(__dirname, './components'),
    }),
  ],
}
```

3. 在Markdown文件中使用组件

```markdown
# 页面标题

页面内容...

<ContentSummarizer />
```

## 注意事项

1. **API密钥安全**：确保API密钥只存储在Vercel环境变量中，不要在前端代码或公开仓库中暴露

2. **CORS配置**：在`summarize.js`中的`allowedOrigins`数组中添加你的网站域名

3. **请求限制**：DeepSeek API可能有请求频率和数量限制，建议在前端添加适当的节流或限制

4. **内容长度**：示例代码中限制了内容长度为30000字符，并只发送前3000字符到DeepSeek API，可根据需要调整

5. **错误处理**：确保前端和Serverless函数都有适当的错误处理机制

## 故障排除

1. **CORS错误**：确保在`allowedOrigins`中添加了正确的域名

2. **API调用失败**：检查API密钥是否正确设置，以及DeepSeek API是否可用

3. **部署问题**：确保`vercel.json`配置正确，并且Vercel项目设置了正确的环境变量

4. **组件不显示**：检查组件是否正确注册，以及在Markdown中的使用方式是否正确

## 参考资源

- [DeepSeek API文档](https://platform.deepseek.com/docs)
- [Vercel Serverless函数文档](https://vercel.com/docs/functions/serverless-functions)
- [Vuepress组件注册](https://v2.vuepress.vuejs.org/reference/plugin-api.html#registercomponentsplugin)