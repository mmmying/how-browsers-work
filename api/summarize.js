// api/summarize.js
export default async (req, res) => {
    const { content } = JSON.parse(req.body);
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{
            role: "user",
            content: `用中文简洁总结以下技术博客内容，列出核心观点：\n\n${content.slice(0, 3000)}` // 限制输入长度
          }],
          temperature: 0.7,
          max_tokens: 500
        })
      });
      const data = await response.json();
      res.status(200).json({ summary: data.choices[0].message.content });
    } catch (error) {
      res.status(500).json({ error: '生成摘要失败' });
    }
  };