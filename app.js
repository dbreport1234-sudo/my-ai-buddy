let recognition;
let synth = window.speechSynthesis;
let voices = [];
let isAiSpeaking = false;
let silenceTimer = null;
let currentTranscript = '';

// 1. โครงสร้างคำสั่งของแต่ละโหมด
const MODE_CONFIGS = {
  companion: {
    lang: 'th-TH',
    instruction: 'คุณคือเพื่อนสนิทชื่อ "บัดดี้" คุยสนุก อารมณ์ดี ช่างพูด ชวนคุยเรื่องทั่วไปได้อย่างเป็นธรรมชาติ ตอบเป็นภาษาไทยสั้นกระชับเหมือนเพื่อนคุยกัน'
  },
  english_teacher: {
    lang: 'en-US',
    instruction: 'You are an encouraging English teacher named "Teacher Alex". Respond naturally in simple English. If the user makes grammar or vocab errors, gently correct them briefly at the end of your response.'
  },
  bilingual_chat: {
    lang: 'th-TH',
    instruction: 'คุณคือเพื่อนคุยสองภาษา (ไทย-อังกฤษ) คุยสนุกเป็นกันเอง ตอบผสมภาษาไทยและศัพท์ภาษาอังกฤษง่ายๆ เพื่อช่วยให้ผู้ใช้คุ้นเคยกับภาษาอังกฤษ'
  }
};

// 2. โหลดรายการเสียงและสร้าง <option> ใน <select id="voiceSelect">
function populateVoiceList() {
  const voiceSelect = document.getElementById('voiceSelect');
  if (!voiceSelect) return;

  voices = synth.getVoices();
  if (voices.length === 0) return;

  voiceSelect.innerHTML = '';

  voices.forEach((voice, index) => {
    // กรองเอาเฉพาะเสียงภาษาไทยและอังกฤษขึ้นแสดงก่อน
    if (voice.lang.includes('th') || voice.lang.includes('en')) {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${voice.name} (${voice.lang})`;
      voiceSelect.appendChild(option);
    }
  });

  if (voiceSelect.options.length === 0) {
    // ถ้าไม่มีเสียง TH/EN เลย ให้โหลดเสียงทั้งหมดมาแสดง
    voices.forEach((voice, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${voice.name} (${voice.lang})`;
      voiceSelect.appendChild(option);
    });
  }
}

// เรียกทำงานทันที และตั้ง Event Listener ดักรอการโหลดเสียงของเบราว์เซอร์
populateVoiceList();
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
}

// 3. เริ่มต้นระบบรับเสียงแบบต่อเนื่อง (Hands-Free)
function initSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    alert('เบราว์เซอร์ของคุณไม่รองรับ Speech Recognition แนะนำให้ใช้ Chrome หรือ Edge');
    return;
  }

  const selectedModeKey = document.getElementById('modeSelect').value;
  const config = MODE_CONFIGS[selectedModeKey] || MODE_CONFIGS.companion;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  recognition.lang = config.lang;
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    if (isAiSpeaking) return;

    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        currentTranscript += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    const fullText = (currentTranscript + interim).trim();
    if (fullText) {
      document.getElementById('status').innerText = `🎙️ [ฟังอยู่]: "${fullText}"`;
      resetSilenceTimer(fullText, config);
    }
  };

  recognition.onend = () => {
    if (!isAiSpeaking && recognition) {
      try { recognition.start(); } catch (e) {}
    }
  };

  try {
    recognition.start();
    document.getElementById('status').innerText = '🎙️ กำลังฟังอยู่... พูดคุยได้เลยครับ!';
  } catch (e) {
    console.error(e);
  }
}

// 4. ตรวจจับความเงียบ (Silence Detection 1.5 วินาที)
function resetSilenceTimer(textToSend, config) {
  clearTimeout(silenceTimer);

  silenceTimer = setTimeout(async () => {
    if (textToSend.length > 0 && !isAiSpeaking) {
      recognition.stop();
      currentTranscript = '';

      addLog('คุณ', textToSend);
      document.getElementById('status').innerText = '🤔 AI กำลังคิดคำตอบ...';

      try {
        const aiResponse = await fetchGeminiResponse(textToSend, config.instruction);
        addLog('AI', aiResponse);
        speakAndListen(aiResponse);
      } catch (err) {
        document.getElementById('status').innerText = '❌ เกิดข้อผิดพลาดในการเชื่อมต่อ';
      }
    }
  }, 1500);
}

// 5. เรียกใช้งาน Vercel API Bridge (`/api/chat`)
async function fetchGeminiResponse(userPrompt, systemInstruction) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userPrompt: userPrompt,
      systemInstruction: systemInstruction
    })
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || 'เกิดข้อผิดพลาดจาก API');
  }

  return data.text;
}

// 6. เล่นเสียง AI + ขยับปากการ์ตูน
function speakAndListen(text) {
  isAiSpeaking = true;
  if (synth.speaking) synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const selectedVoiceIndex = document.getElementById('voiceSelect')?.value;

  if (selectedVoiceIndex !== undefined && voices[selectedVoiceIndex]) {
    utterance.voice = voices[selectedVoiceIndex];
  }

  const avatarBg = document.getElementById('avatarBg');

  utterance.onstart = () => {
    if (avatarBg) avatarBg.classList.add('talking');
    document.getElementById('status').innerText = '🗣️ AI กำลังพูด...';
  };

  utterance.onend = () => {
    if (avatarBg) avatarBg.classList.remove('talking');
    isAiSpeaking = false;
    currentTranscript = '';
    document.getElementById('status').innerText = '🎙️ กำลังฟังอยู่... พูดต่อได้เลยครับ';
    try { recognition.start(); } catch (e) {}
  };

  synth.speak(utterance);
}

// 7. Event Listeners
document.getElementById('startBtn')?.addEventListener('click', () => {
  populateVoiceList(); // โหลดเสียงซ้ำอีกครั้งเมื่อกดเริ่ม
  if (recognition) {
    recognition.stop();
  }
  initSpeechRecognition();
});

document.getElementById('modeSelect')?.addEventListener('change', () => {
  if (recognition) {
    recognition.stop();
    initSpeechRecognition();
  }
});

function addLog(sender, msg) {
  const log = document.getElementById('chatLog');
  if (!log) return;
  const className = sender === 'คุณ' ? 'user' : 'ai';
  log.innerHTML += `<div class="${className}"><strong>${sender}:</strong> ${msg}</div>`;
  log.scrollTop = log.scrollHeight;
}
