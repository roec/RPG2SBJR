interface DeepSeekMessage {
  role: 'system' | 'user';
  content: string;
}

interface DeepSeekOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export async function callDeepSeek<T>(
  { prompt, model = 'deepseek-chat', temperature = 0.1, max_tokens = 1800 }: DeepSeekOptions,
  mockFactory: () => T
): Promise<{ output: T; mode: 'live' | 'mock' }> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return { output: mockFactory(), mode: 'mock' };
  }

  const messages: DeepSeekMessage[] = [
    {
      role: 'system',
      content:
        'You are a migration agent that converts RPG assets into Spring Boot artifacts. Always return strict JSON only.'
    },
    { role: 'user', content: prompt }
  ];

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens,
      messages,
      tools: [
        {
          type: 'function',
          function: {
            name: 'emit_json',
            description: 'Emit final JSON payload'
          }
        }
      ]
    })
  });

  if (!response.ok) {
    return { output: mockFactory(), mode: 'mock' };
  }

  const raw = await response.json();
  const content = raw?.choices?.[0]?.message?.content;
  if (!content) {
    return { output: mockFactory(), mode: 'mock' };
  }

  try {
    return { output: JSON.parse(content) as T, mode: 'live' };
  } catch {
    return { output: mockFactory(), mode: 'mock' };
  }
}
