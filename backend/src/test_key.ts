import fs from 'fs';
import path from 'path';

async function testGeminiKey() {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
  const match = envContent.match(/GEMINI_API_KEY="([^"]+)"/);
  const key = match ? match[1] : '';
  console.log('Testing key:', key?.substring(0, 10), 'len:', key?.length);
  
  const targetModel = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${key}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Ping test. Reply with: OK' }] }],
        generationConfig: { maxOutputTokens: 10 }
      })
    });

    console.log('Status:', response.status, response.statusText);
    const text = await response.text();
    console.log('Response body:', text);
  } catch (err: any) {
    console.error('Fetch error:', err.message, err.cause);
  }
}

testGeminiKey();

