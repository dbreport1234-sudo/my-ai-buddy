\# 🤖 AI Buddy — AI Companion \& Interactive Language Tutor



\*\*AI Buddy\*\* คือ เว็บแอปพลิเคชัน AI โต้ตอบด้วยเสียงแบบเปิดไมค์คุยต่อเนื่อง (Hands-Free) มาพร้อมกับตัวละครการ์ตูนขยับปากตามเสียงพูด (Lip-Sync Animation) และระบบเปลี่ยนโหมดการโต้ตอบอิสระ ไม่ว่าจะคุยเล่นแก้เหงา หรือฝึกภาษาอังกฤษกับ AI



โปรเจกต์นี้รองรับการ Deploy บน \*\*Vercel\*\* อย่างปลอดภัย ด้วยการซ่อน API Key ไว้ที่ฝั่ง Serverless Function (`/api/chat.js`) ผู้ใช้งานจึงเปิดเว็บมาพร้อมใช้งานได้ทันทีโดยไม่ต้องกรอก API Key บนหน้าเว็บ



\---



\### ✨ ฟีเจอร์เด่น (Key Features)



\* 🎙️ \*\*Hands-Free Voice Interaction:\*\* พูดคุยโต้ตอบต่อเนื่องด้วยระบบ Silence Detection (ตรวจจับความเงียบ 1.5 วินาทีส่งคำถามอัตโนมัติ) ไม่ต้องกดปุ่มทุกครั้งที่พูด

\* 🎯 \*\*Dynamic Mode Selection:\*\* เลือกโหมดการทำงานได้ตั้งแต่เริ่มต้น

&#x20; \* \*\*🤝 เพื่อนคุยแก้เหงา:\*\* คุยเล่นเรื่องทั่วไป ภาษาไทยเป็นกันเอง ชวนคุยเก่ง

&#x20; \* \*\*🇬🇧 ครูสอนภาษาอังกฤษ:\*\* คุยภาษาอังกฤษ พร้อมช่วยตรวจแก้ไวยากรณ์ (Grammar) และคำศัพท์สั้นๆ

&#x20; \* \*\*🌏 คุยสลับ 2 ภาษา:\*\* คุยภาษาไทยผสมอังกฤษแบบสลวย ชิลๆ เหมาะกับการฝึกซ้อมในชีวิตประจำวัน

\* 🎭 \*\*Animated Cartoon Mascot:\*\* ตัวละครการ์ตูนขยับปาก Real-time ตามจังหวะการเปล่งเสียงพูดของระบบ Web Speech Synthesis

\* 🔒 \*\*Secure Architecture:\*\* ซ่อน `GEMINI\_API\_KEY` ไว้ใน Vercel Environment Variables ผ่าน API Route ไม่เสี่ยงโดนดึง Key จากฝั่ง Client



\---



\### 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)



\* \*\*Frontend:\*\* HTML5, CSS3, JavaScript (ES6+)

\* \*\*Voice \& Speech:\*\* Web Speech API (`SpeechRecognition` \& `SpeechSynthesis`)

\* \*\*AI Model:\*\* Google Gemini API (`gemini-1.5-flash`)

\* \*\*Backend / Deployment:\*\* Vercel Serverless Functions (Node.js runtime)



\---



\### 🚀 การติดตั้งและตั้งค่าใช้งาน (Setup \& Deployment)



1\. \*\*Clone Repository\*\*

&#x20;  ```bash

&#x20;  git clone \[https://github.com/your-username/ai-buddy.git](https://github.com/your-username/ai-buddy.git)

&#x20;  cd ai-buddy

