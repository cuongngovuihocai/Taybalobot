
export interface ScriptLine {
  role: 'user' | 'bot';
  text: string;
  translation: string;
}

export type Difficulty = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface ConversationTurnForFeedback {
  role: 'user';
  expected: string;
  actual: string;
}

export type AppPhase = 'apiKeyNeeded' | 'topicSelection' | 'generatingScript' | 'inConversation' | 'generatingFeedback' | 'conversationEnded';
