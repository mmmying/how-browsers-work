// api/summarize.js
export default async (req, res) => {
  // 处理 OPTIONS 预检请求
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  // 处理 POST 请求
  if (req.method === "POST") {
    try {
      const { content } = JSON.parse(req.body);
      // 调用 DeepSeek API 的逻辑...
      const summary = "生成摘要结果...";

      // 设置 CORS 响应头
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/json");
      res.status(200).json({ summary });
    } catch (error) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(500).json({ error: "生成摘要失败" });
    }
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(`${process.env.DEEPSEEK_API_URL}`, {
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
            content: `用中文简洁总结以下技术博客内容，列出核心观点：\n\n${content.slice(0, 3000)}` // 限制输入长度
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    const data = await response.json();
    res.status(200).json({ summary: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "生成摘要失败" });
  }
};
