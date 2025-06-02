import {callAnthropicAPI} from './chat-claude';
import {callChatGPTAPI} from './chatgpt';
import { fs, path } from '../../lib/cep/node';
import { preferencesDir } from '../preferences';

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
};

type Conversation = {
  id: string;
  initialPrompt: string;
  type: "scripts" | "expressions";
  agent: "claude" | "chatgpt";
  messages: Message[];
}


export const getConversationHistory = async () => {
 const historyFile = path.join(preferencesDir, 'conversation-history.json');
 if (!fs.existsSync(historyFile)) {
   fs.mkdirSync(path.dirname(historyFile), { recursive: true });
   fs.writeFileSync(historyFile, '[]', 'utf-8');
   return [];
 }
 return JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
};

export const setConversationHistory = async (conversationHistory: any) => {
 const historyFile = path.join(preferencesDir, 'conversation-history.json');
 if (!fs.existsSync(historyFile)) {
   fs.mkdirSync(path.dirname(historyFile), { recursive: true });
 }
 try {
   fs.writeFileSync(historyFile, JSON.stringify(conversationHistory, null, 2), 'utf-8');
   return true;
 } catch (e) {
   console.error('Failed to write preferences', e);
   throw e;
 }
};

export const addConversation = async (conversation: Conversation) => {
 const conversationHistory = await getConversationHistory();
 try {
   await setConversationHistory(conversationHistory.concat(conversation));
   return true;
 } catch (e) {
   console.error('Failed to write preferences', e);
   throw e;
 }
};  

export const callAiAgent = async (prompt: string, agent: "Claude" | "ChatGPT",token: string) => {
  if (agent === "Claude") {
    return await callAnthropicAPI(prompt, token, "expressions");
  } else {
    return await callChatGPTAPI(prompt, token, "expressions");
  }
};