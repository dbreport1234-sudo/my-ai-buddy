export default async function handler(req, res) {
  // รับเฉพาะ HTTP Method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userPrompt, systemInstruction } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. ตรวจสอบว่ามี API Key หรือไม่
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Vercel Environment Variables' 
      });
    }

    // 2. ใช้ Endpoint Gemini 1.5 Flash
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

    // 3. ยิง Request ไปยัง Google Gemini API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { 
                text: `${systemInstruction ? systemInstruction + '\n\n' : ''}ผู้ใช้พูดว่า: "${userPrompt}"` 
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    // 4. ตรวจสอบว่า Google ส่ง Error กลับมาหรือไม่
    if (!response.ok || data.error) {
      console.error('Google Gemini Error Detail:', data.error);
      return res.status(response.status || 500).json({
        error: `Google API Error (${data.error?.code || response.status}): ${data.error?.message || 'การเชื่อมต่อมีปัญหา'}`
      });
    }

    // 5. ดึงข้อความตอบกลับอย่างปลอดภัย
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (replyText) {
      return res.status(200).json({ text: replyText });
    } else {
      return res.status(500).json({ error: 'ไม่พบข้อความตอบกลับจาก AI (อาจติด Safety Filter)' });
    }

  } catch (error) {
    console.error('Server Catch Error:', error);
    return res.status(500).json({ error: `Server Crash: ${error.message}` });
  }
}
