export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userPrompt, systemInstruction } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Vercel Settings' });
  }

  // ปรับแก้ Endpoint เป็นรูปแบบมาตรฐานที่ถูกต้อง
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemInstruction}\n\nผู้ใช้พูดว่า: "${userPrompt}"` }]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Gemini API Error Detail:', data.error);
      return res.status(data.error.code || 500).json({ 
        error: `Gemini API Error: ${data.error.message || 'Unknown error'}` 
      });
    }

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const replyText = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ text: replyText });
    } else {
      return res.status(500).json({ error: 'ไม่พบข้อความตอบกลับจาก AI' });
    }

  } catch (error) {
    console.error('Server Catch Error:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์' });
  }
}
