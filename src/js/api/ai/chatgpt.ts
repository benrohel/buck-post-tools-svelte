// OpenAI ChatGPT API call, similar structure to chat-claude.ts
import { OPENAI_TOKEN } from '../../../../secrets';

// Optionally import system role messages if you want to differentiate roles (like in chat-claude.ts)
// import afterEffectsAgentSystemRole from './after-effects-agent-system-role';
// import afterEffectsExpressionsSystemRole from './after-effects-expressions-system-role';

const PROXY_URL = 'http://localhost:3001/api/openai/chat/completions';
const BASE_URL = 'https://api.openai.com/v1/chat/completions';

if (!OPENAI_TOKEN) {
  console.error('ERROR: OPENAI_TOKEN is not defined in secrets.ts');
}

const URL = import.meta.env.DEV ? PROXY_URL : BASE_URL;

export async function callChatGPTAPI(
  prompt: string,
  apiKey: string,
  systemRole?: "scripts" | "expressions"
): Promise<string> {
  try {
    console.log('Calling ChatGPT API on', URL, 'with prompt:', prompt);

    // Compose the messages array for OpenAI
    const messages = [
      // Optionally add a system message if you want role-specific behavior
      // {
      //   role: 'system',
      //   content: systemRole === 'scripts' ? afterEffectsAgentSystemRole : afterEffectsExpressionsSystemRole,
      // },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Or 'gpt-3.5-turbo' or another available model
        messages,
        max_tokens: 2000,
        stream: false, // Set to true if you want streaming responses
      }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const responseClone = response.clone();
      const errorBody = await responseClone.text();
      console.error('Error response body:', errorBody);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}\n${errorBody}`);
    }

    const data = await response.json();
    // OpenAI returns choices[0].message.content
    const content = data.choices?.[0]?.message?.content || '';
    return content;
  } catch (e) {
    console.error('Error in callChatGPTAPI:', e);
    throw e;
  }
}
