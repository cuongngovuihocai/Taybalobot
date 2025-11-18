
import { Difficulty, ConversationTurnForFeedback } from './types';

const difficultyInstructions: Record<Difficulty, string> = {
  A1: 'The script should use simple A1-level (Beginger) vocabulary and basic sentence structures, focusing on everyday topics like personal information and immediate surroundings.',
  A2: 'The script should use A2-level (Elementary) vocabulary. Sentences should be straightforward, covering routine tasks and direct exchange of information.',
  B1: 'The script should use B1-level (Intermediate) vocabulary. The conversation should handle main points on familiar matters, allowing for expressing opinions and plans.',
  B2: 'The-script should use B2-level (Upper-Intermediate) vocabulary. It can involve more complex sentences on both concrete and abstract topics, allowing for a degree of fluency and spontaneity.',
  C1: 'The script should use C1-level (Advanced) vocabulary, including idiomatic expressions. It should feature complex sentence structures for social, academic, and professional purposes, showing effective and flexible language use.'
};

const turnCountByDifficulty: Record<Difficulty, { min: number; max: number }> = {
  A1: { min: 20, max: 28 }, // 10-14 user turns
  A2: { min: 24, max: 34 }, // 12-17 user turns
  B1: { min: 28, max: 40 }, // 14-20 user turns
  B2: { min: 32, max: 46 }, // 16-23 user turns
  C1: { min: 36, max: 52 }, // 18-26 user turns
};


export const scriptGenerationPrompt = (topic: string, difficulty: Difficulty): string => {
  const turns = turnCountByDifficulty[difficulty];
  return `
You are an AI English tutor scriptwriter. Your goal is to create a sophisticated, natural, and friendly conversation script for a user learning English, using a native British English conversational style.
The user wants to practice speaking about the topic: "${topic}".
The user's English level is "${difficulty}".

${difficultyInstructions[difficulty]}

The script should be an array of objects in JSON format. Each object represents a turn in the conversation and must have three properties:
1. "role": either "bot" or "user".
2. "text": the English sentence for that turn.
3. "translation": the Vietnamese translation of the "text".

Rules for the script content:
- The conversation must be logical, culturally aware, and demonstrate knowledge on the topic.
- Use natural, everyday British English colloquialisms and phrasings.
- The bot's responses should be concise (1-2 sentences) and often end with a question to encourage interaction.
- The user's lines should be natural responses to the bot's questions.
- The script should have a natural flow with a clear beginning, middle, and end.
- The conversation should delve deeper into the topic, avoiding simple, superficial exchanges.
- Each level should have a mix of sentence lengths and complexities. Even the easiest level should have some variation.
- The total script should contain between ${turns.min} and ${turns.max} turns.
- The first turn MUST be from the "bot".

Example output format for a different topic:
[
  {
    "role": "bot",
    "text": "Alright, mate? I hear you're into cooking. What's your favourite thing to rustle up?",
    "translation": "This should be the VIETNAMESE translation of the English text."
  },
  {
    "role": "user",
    "text": "I love making spaghetti bolognese. It's a proper classic, isn't it?",
    "translation": "This should be the VIETNAMESE translation of the English text."
  }
]

Now, generate the JSON script for the topic: "${topic}".
`;
};


export const feedbackGenerationPrompt = (history: ConversationTurnForFeedback[], difficulty: Difficulty, score: number): string => `
You are an expert AI English language tutor. Your task is to provide feedback to a student based on their performance in a practice conversation.
The student was practicing at the "${difficulty}" level.

Here is the user's performance history. For each turn, you will see the 'expected' text from the script and the 'actual' text that the user spoke (transcribed).
---
${history.map(turn => `Expected: "${turn.expected}"\nActual:   "${turn.actual}"`).join('\n\n')}
---

Based on this, provide concise, encouraging, and constructive feedback. Follow these rules:
1.  **Start with the Score:** Begin the feedback by stating the user's score. The user's completion score is ${score} out of 10. Frame it positively. For example: "Great work! Your completion score for this session is ${score}/10."
2.  **Be Positive:** Follow the score with something the user did well. Even if they struggled, find something to praise (e.g., "You did a great job attempting all the lines!").
3.  **Be Specific & Gentle:** Identify ONE primary area for improvement. Compare the 'expected' and 'actual' text. Look for patterns in pronunciation mistakes (e.g., missed '-s' endings, vowel sounds) or skipped words. Frame it gently, like "One thing to watch out for is..." or "A helpful tip for next time...". Do not be harsh.
4.  **Be Actionable:** Suggest a simple, concrete next step for them to focus on. For example, "For your next practice, try focusing on the 'th' sound," or "Try to speak a little more slowly to make sure you pronounce every word."
5.  **Keep it Short:** The entire feedback should be 3-5 sentences (under 120 words).
6.  **Address the User Directly:** Use "you" and "your".

Generate the feedback now as a single block of text.
`;

export const translationPrompt = (text: string, language: string): string => `
Translate the following English text to ${language} in a natural and fluent way.
Only return the translated text, without any additional comments or explanations.

English text:
---
${text}
---

${language} Translation:
`;