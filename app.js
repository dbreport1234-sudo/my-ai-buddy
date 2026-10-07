async function fetchGeminiResponse(userPrompt, systemInstruction) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userPrompt: userPrompt,
        systemInstruction: systemInstruction
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
    }

    return data.text;
  } catch (error) {
    console.error('Fetch Error:', error);
    throw error;
  }
}
