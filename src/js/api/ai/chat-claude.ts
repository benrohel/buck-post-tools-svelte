import { CLAUDE_TOKEN } from '@/../../secrets';
import afterEffectsAgentSystemRole from './after-effects-agent-system-role';
import afterEffectsExpressionsSystemRole from './after-effects-expressions-system-role';
import { logModule } from '@/lib/logger';

const log = logModule('chat-claude');

// Define the proxy URL - use proxy server for local development
const PROXY_URL = 'http://localhost:3001/api/anthropic/messages';
const BASE_URL = 'https://api.anthropic.com/v1/messages';
// Check if API key is available
if (!CLAUDE_TOKEN) {
  log.error('CLAUDE_TOKEN is not defined in secrets.ts', new Error('Missing API token'));
}

const URL = import.meta.env.DEV ? PROXY_URL : BASE_URL;

export async function callAnthropicAPI(
  prompt: string,
  apiKey: string,
  systemRole: "scripts" | "expressions"
): Promise<string> {
  try {
    log.debug('Calling Claude API', { url: URL, promptLength: prompt.length, systemRole });
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
        system: systemRole === 'scripts' ? afterEffectsAgentSystemRole : afterEffectsExpressionsSystemRole,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    log.debug('Claude API response received', { status: response.status });

    if (!response.ok) {
      // Clone the response so we can read the body text
      const responseClone = response.clone();
      const errorBody = await responseClone.text();
      log.error('Claude API error response', new Error(`API request failed with status ${response.status}`), { status: response.status, errorBody });

      throw new Error(
        `API request failed with status ${response.status}: ${errorBody}`
      );
    }

    // Parse streaming response
    if (!response.body) {
      throw new Error('Response body is null');
    }
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
            log.warn('Failed to parse streaming chunk', { line, error: e });
          }
        }
      }
    }

    return fullText;
  } catch (error) {
    log.error('Error calling Claude API', error as Error);
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
