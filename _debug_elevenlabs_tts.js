const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
  const out = {};
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

async function fetchJson(url, apiKey) {
  const res = await fetch(url, { headers: { 'xi-api-key': apiKey } });
  const txt = await res.text();
  let data = null;
  try {
    data = JSON.parse(txt);
  } catch {
    data = txt;
  }
  return { status: res.status, data };
}

async function postTts(voiceId, modelId, apiKey, text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      output_format: 'mp3_22050_32',
    }),
  });
  const buf = await res.arrayBuffer();
  return {
    status: res.status,
    contentType: res.headers.get('content-type') || '',
    bytes: buf.byteLength,
    bodyText: res.status >= 400 ? Buffer.from(buf).toString('utf8').slice(0, 2000) : '',
  };
}

async function main() {
  const env = loadEnv(path.join(process.cwd(), '.env'));
  const apiKey = env.ELEVENLABS_API_KEY;
  const agentId = env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) throw new Error('Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID');

  const agentRes = await fetchJson(
    `https://api.elevenlabs.io/v1/convai/agents/${encodeURIComponent(agentId)}`,
    apiKey
  );
  console.log('agent_status=', agentRes.status);
  if (agentRes.status !== 200) {
    console.log(agentRes.data);
    return;
  }

  const voiceId = agentRes.data?.conversation_config?.tts?.voice_id;
  const modelId = agentRes.data?.conversation_config?.tts?.model_id;
  console.log('agent_voice_id=', voiceId);
  console.log('agent_tts_model=', modelId);

  const voicesRes = await fetchJson('https://api.elevenlabs.io/v1/voices', apiKey);
  console.log('voices_status=', voicesRes.status);
  const voices = Array.isArray(voicesRes.data?.voices) ? voicesRes.data.voices : [];
  const hasVoice = voices.some((v) => v.voice_id === voiceId);
  console.log('voice_exists_in_account=', hasVoice);
  console.log(
    'voices_preview=',
    voices
      .slice(0, 20)
      .map((v) => `${v.name} [${v.category || 'unknown'}] ${v.voice_id}`)
      .join(' | ')
  );
  if (!hasVoice) {
    console.log('available_voice_ids=', voices.slice(0, 10).map((v) => `${v.name}:${v.voice_id}`).join(', '));
  }

  if (voiceId && modelId) {
    const tts = await postTts(
      voiceId,
      modelId,
      apiKey,
      'Hello, this is a short test to validate text to speech for SomaAI.'
    );
    console.log('tts_status=', tts.status);
    console.log('tts_content_type=', tts.contentType);
    console.log('tts_bytes=', tts.bytes);
    if (tts.bodyText) {
      console.log('tts_error=', tts.bodyText);
    }
  }

  // Find first voice that succeeds for this account/plan with current model.
  console.log('\nsearching_for_api_allowed_voice...');
  let found = null;
  for (const v of voices.slice(0, 30)) {
    if (!v?.voice_id) continue;
    const probe = await postTts(
      v.voice_id,
      modelId || 'eleven_turbo_v2',
      apiKey,
      'Quick voice eligibility test.'
    );
    if (probe.status === 200) {
      found = { name: v.name, voice_id: v.voice_id, category: v.category || 'unknown' };
      break;
    }
  }
  if (found) {
    console.log('api_allowed_voice=', found);
  } else {
    console.log('api_allowed_voice= none found in first 30 voices');
  }
}

main().catch((err) => {
  console.error('debug_failed=', err?.message || err);
  process.exit(1);
});
