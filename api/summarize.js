// api/summarize.js
export default async (req, res) => {
  // --------------- CORS 配置 ---------------
  const allowedOrigins = ["http://localhost:8080", "https://your-domain.com"];
  const origin = req.headers.origin;
  const isOriginAllowed = allowedOrigins.includes(origin);

  // 设置 CORS 头的辅助函数，避免重复代码
  const setCorsHeaders = () => {
    res.setHeader("Access-Control-Allow-Origin", isOriginAllowed ? origin : "");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  };

  // --------------- 处理 OPTIONS 预检请求 ---------------
  if (req.method === "OPTIONS") {
    setCorsHeaders();
    return res.status(200).end();
  }

  // --------------- 处理 POST 请求 ---------------
  if (req.method === "POST") {
    try {
      // 验证来源
      if (!isOriginAllowed) {
        setCorsHeaders();
        return res.status(403).json({ error: "非法来源" });
      }

      // 解析请求体
      const { content } = JSON.parse(req.body);
      // console.log('req.body.content', content);
      if (!content || content.length > 3000) {
        setCorsHeaders();
        return res.status(400).json({ error: "无效内容" });
      }

      // 调用 DeepSeek API
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
              content: `用中文分3点总结以下技术内容：\n\n${content.slice(0, 3000)}`
            }
          ]
        })
      });

      if (!apiResponse.ok) throw new Error("API 调用失败");
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

  // --------------- 其他请求方法处理 ---------------
  setCorsHeaders();
  return res.status(405).json({ error: "不允许的请求方法" });
};
