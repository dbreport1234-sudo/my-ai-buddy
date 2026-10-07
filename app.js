let recognition = null;
let synth = window.speechSynthesis;
let voices = [];
let isAiSpeaking = false;
let silenceTimer = null;
let currentTranscript = '';

const MODE_CONFIGS = {
  companion: {
    lang: 'th-TH',
    instruction: 'คุณคือเพื่อนสนิทชื่อ "บัดดี้" คุยสนุก อารมณ์ดี ตอบสั้นกระชับเป็นภาษาไทยเหมือนเพื่อนคุยกัน'
  },
  english_teacher: {
    lang: 'en-US',
    instruction: 'You are an encouraging English teacher named "Teacher Alex". Respond naturally in simple English. Briefly correct any grammar errors.'
  },
  bilingual_chat: {
    lang: 'th-TH',
    instruction: 'คุณคือเพื่อนคุยสองภาษา (ไทย-อังกฤษ) คุยสนุก ตอบผสมภาษาไทยและอังกฤษง่ายๆ'
  }
};

// 1. ฟังก์ชันโหลดเสียงแบบบังคับดึงข้อมูล
function loadVoices() {
  voices = synth.getVoices();
  const voiceSelect = document.getElementById('voiceSelect');
  if (!voiceSelect) return;

  if (voices.length > 0) {
    voiceSelect.innerHTML = '';
    voices.forEach((voice, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${voice.name} (${voice.lang})`;
      
      // เลือกเสียงไทยหรืออังกฤษเป็น default
      if (voice.lang.includes('th') || voice.lang.includes('en')) {
        voiceSelect.appendChild(option);
      }
    });

    if (voiceSelect.options.length === 0) {
      voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
      });
    }
  }
}

// รองรับการโหลดเสียงทุกเบราว์เซอร์
loadVoices();
if (synth.onvoiceschanged !== undefined) {
  synth.onvoiceschanged = loadVoices;
}

// 2. ระบบรับเสียง
function startSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    alert('เบราว์เซอร์นี้ไม่รองรับการฟังเสียง แนะนำให้ใช้ Google Chrome ครับ');
    return;
  }

  const selectedModeKey = document.getElementById('modeSelect').value;
  const config = MODE_CONFIGS[selectedModeKey] || MODE_CONFIGS.companion;

  if (recognition) {
    try { recognition.stop(); } catch(e){}
  }

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
      document.getElementById('status').innerText = `🎙️ [กำลังฟัง]: "${fullText}"`;
      resetSilenceTimer(fullText, config);
    }
  };

  recognition.onerror = (event) => {
    console.log('Speech recognition error:', event.error);
  };

  recognition.onend = () => {
    if (!isAiSpeaking && recognition) {
      try { recognition.start(); } catch (e) {}
    }
  };

  try {
    recognition.start();
    document.getElementById('status').innerText = '🎙️ เริ่มฟังแล้ว... พูดใส่ไมค์ได้เลยครับ!';
  } catch (e) {
    console.error(e);
  }
}

// 3. ตรวจจับการหยุดพูด 1.5 วินาที
function resetSilenceTimer(textToSend, config) {
  clearTimeout(silenceTimer);

  silenceTimer = setTimeout(async () => {
    if (textToSend.length > 0 && !isAiSpeaking) {
      if (recognition) recognition.stop();
      currentTranscript = '';

      addLog('คุณ', textToSend);
      document.getElementById('status').innerText = '🤔 AI กำลังคิด...';

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userPrompt: textToSend,
            systemInstruction: config.instruction
          })
        });

        const data = await response.json();

        if (data.error) {
          addLog('ระบบ', ` Error: ${data.error}`);
          document.getElementById('status').innerText = '❌ เกิดข้อผิดพลาด';
        } else {
          addLog('AI', data.text);
          speakResponse(data.text);
        }
      } catch (err) {
        addLog('ระบบ', ' ไม่สามารถเชื่อมต่อกับ /api/chat ได้');
        document.getElementById('status').innerText = '❌ เชื่อมต่อล้มเหลว';
      }
    }
  }, 1500);
}

// 4. สั่ง AI พูดออกเสียง
function speakResponse(text) {
  isAiSpeaking = true;
  synth.cancel(); // ล้างเสียงที่ค้างอยู่

  const utterance = new SpeechSynthesisUtterance(text);
  const voiceSelect = document.getElementById('voiceSelect');
  const selectedIndex = voiceSelect ? voiceSelect.value : '';

  if (selectedIndex !== '' && voices[selectedIndex]) {
    utterance.voice = voices[selectedIndex];
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
    document.getElementById('status').innerText = '🎙️ กำลังฟัง... พูดต่อได้เลยครับ';
    try { recognition.start(); } catch (e) {}
  };

  synth.speak(utterance);
}

// 5. ปุ่มกดเริ่มการทำงาน
document.getElementById('startBtn').addEventListener('click', () => {
  loadVoices(); // โหลดเสียงทันทีที่ผู้ใช้คลิก
  startSpeechRecognition();
});

document.getElementById('modeSelect').addEventListener('change', () => {
  if (recognition) {
    startSpeechRecognition();
  }
});

function addLog(sender, msg) {
  const log = document.getElementById('chatLog');
  if (!log) return;
  const className = sender === 'คุณ' ? 'user' : 'ai';
  log.innerHTML += `<div class="${className}"><strong>${sender}:</strong> ${msg}</div>`;
  log.scrollTop = log.scrollHeight;
}