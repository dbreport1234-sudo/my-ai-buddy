export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userPrompt, systemInstruction } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Vercel Environment Variables' });
  }

  // ปรับใช้ gemini-1.5-flash-latest หรือ gemini-2.0-flash
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemInstruction || ''}\n\nผู้ใช้พูดว่า: "${userPrompt}"` }]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Gemini API Error:', data.error);
      return res.status(data.error.code || 500).json({ 
        error: `Gemini API Error: ${data.error.message}` 
      });
    }

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
    } else {
      return res.status(500).json({ error: 'ไม่ได้รับข้อความตอบกลับจาก Gemini API' });
    }

  } catch (error) {
    console.error('Server Catch Error:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
}
