// api/summarize.js
export default async (req, res) => {
  // --------------- CORS 全局配置 ---------------
  // 允许的域名列表（按需修改）
  const allowedOrigins = [
    'http://localhost:8080',    // 本地开发
    'https://your-domain.com'   // 生产环境域名
  ];
  
  // 获取请求来源并验证
  const origin = req.headers.origin;
  const isOriginAllowed = allowedOrigins.includes(origin);
  
  // 设置动态 CORS 头（仅允许白名单中的域名）
  const corsHeaders = {
    'Access-Control-Allow-Origin': isOriginAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // --------------- 处理 OPTIONS 预检请求 ---------------
  if (req.method === 'OPTIONS') {
    // 直接返回 CORS 头，不处理业务逻辑
    return res
      .status(200)
      .set({ ...corsHeaders })
      .end();
  }

  // --------------- 处理 POST 请求 ---------------
  if (req.method === 'POST') {
    try {
      // 验证来源合法性
      if (!isOriginAllowed) {
        return res
          .status(403)
          .set({ ...corsHeaders })
          .json({ error: '请求来源未授权' });
      }

      // 解析请求体
      const { content } = JSON.parse(req.body);
      
      // 内容验证
      if (!content || typeof content !== 'string') {
        return res
          .status(400)
          .set({ ...corsHeaders })
          .json({ error: '内容不能为空' });
      }
      if (content.length > 3000) {
        return res
          .status(400)
          .set({ ...corsHeaders })
          .json({ error: '内容长度超过限制' });
      }

      // --------------- 调用 DeepSeek API ---------------
      const apiResponse = await fetch(`${process.env.DEEPSEEK_API_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{
            role: "user",
            content: `用中文简洁总结以下技术博客内容，列出核心观点：\n\n${content.slice(0, 3000)}`
          }],
          temperature: 0.7,
          max_tokens: 500
        })
      });
      console.log('deepseek apiResponse', apiResponse)
      // 处理 API 错误响应
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(`DeepSeek API Error: ${errorData.error?.message || '未知错误'}`);
      }

      // 提取摘要并格式化
      const { choices } = await apiResponse.json();
      const summary = choices[0].message.content.replace(/\n/g, '<br>');

      // 返回成功响应
      return res
        .status(200)
        .set({ 
          ...corsHeaders,
          'Cache-Control': 'public, max-age=3600' // 添加缓存控制
        })
        .json({ summary });

    } catch (error) {
      // --------------- 统一错误处理 ---------------
      console.error(`[ERROR] ${new Date().toISOString()}`, error);
      
      return res
        .status(500)
        .set({ ...corsHeaders })
        .json({ 
          error: '摘要生成失败',
          ...(process.env.NODE_ENV === 'development' && { detail: error.message })
        });
    }
  }

  // --------------- 其他 HTTP 方法处理 ---------------
  return res
    .status(405)
    .set({ ...corsHeaders })
    .json({ error: '不允许的请求方法' });
};