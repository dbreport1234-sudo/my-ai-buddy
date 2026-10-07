export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userPrompt, systemInstruction } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Vercel Environment Variables' });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemInstruction ? systemInstruction + '\n\n' : ''}ผู้ใช้พูดว่า: "${userPrompt}"` }]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(response.status || 500).json({ error: data.error?.message || 'Gemini API Error' });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).json({ text: replyText || 'ไม่มีข้อความตอบกลับ' });

  } catch (error) {
    return res.status(500).json({ error: `Server Error: ${error.message}` });
  }
}
