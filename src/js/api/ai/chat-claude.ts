import { CLAUDE_TOKEN } from '../../../../secrets';
import afterEffectsAgentSystemRole from './after-effects-agent-system-role';
// Define the proxy URL - use proxy server for local development
const PROXY_URL = 'http://localhost:3001/api/anthropic/messages';
const BASE_URL = 'https://api.anthropic.com/v1/messages';
// Check if API key is available
if (!CLAUDE_TOKEN) {
  console.error('ERROR: CLAUDE_TOKEN is not defined in secrets.ts');
}

const URL = import.meta.env.DEV ? PROXY_URL : BASE_URL;

export async function callAnthropicAPI(
  prompt: string,
  apiKey: string
): Promise<string> {
  try {
    console.log('Calling Claude API on', URL, 'with prompt:', prompt);
    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 20000,
        stream: true, // Changed to false to get complete response at once
        system: afterEffectsAgentSystemRole,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      // Clone the response so we can read the body text
      const responseClone = response.clone();
      const errorBody = await responseClone.text();
      console.error('Error response body:', errorBody);

      throw new Error(
        `API request failed with status ${response.status}: ${errorBody}`
      );
    }

    // Option 1: For non-streaming response (stream: false)
    // const responseData = await response.json();
    // console.log('Response data:', responseData);
    // return responseData;
    // return responseData.content[0].text;

    //  Option 2: For streaming response (if you want to keep stream: true)
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);

      // Parse each chunk as event-stream data
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.substring(6));
            if (
              data.type === 'content_block_delta' &&
              data.delta &&
              data.delta.text
            ) {
              fullText += data.delta.text;
            }
          } catch (e) {
            console.warn('Failed to parse chunk:', line);
          }
        }
      }
    }

    return fullText;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}

export function extractCodeFromMarkdown(markdown: string): string {
  // Regular expression to match code blocks
  const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)\n```/g;

  let match;
  let extractedCode = '';

  // Find all code blocks in the markdown
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    extractedCode += match[1];
  }

  return extractedCode;
}
