export default async function handler(req, res) {
  // รับเฉพาะ HTTP POST Request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userPrompt, systemInstruction } = req.body;
  
  // ดึงค่า API Key จาก Environment Variable บน Vercel
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Vercel Settings' });
  }

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
    const replyText = data.candidates[0].content.parts[0].text;

    return res.status(200).json({ text: replyText });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการขอข้อมูลจาก Gemini API' });
  }
}