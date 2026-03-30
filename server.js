require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { OpenAI } = require('openai');
const { initializeKnowledgeBase, findRelevantContext } = require('./rag');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const USE_LLM = process.env.USE_LLM?.toLowerCase() === 'true';

if (!USE_LLM) {
  console.log('LLM disabled via USE_LLM=false. Using local deterministic fallback responses only.');
} else if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_groq_api_key_here') {
  console.warn('USE_LLM=true but no valid API key provided. Get a free Groq key at https://console.groq.com/keys');
} else {
  console.log(`Using Groq LLM: ${OPENAI_MODEL} at ${OPENAI_BASE_URL}`);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY, baseURL: OPENAI_BASE_URL });

const personaSystemPrompt = {
  Craig: `You are Craig, Director of Engineering at a mid-sized company (~5000 employees). Use high-level systems thinking, risk/ROI language, and references to enterprise-scale architectures. Use insight from Hacker News, InfoQ, and Martin Fowler when relevant. Keep responses in a leadership tone, avoid deep code detail, and mention process/organization tradeoffs.`,
  Kyle: `You are Kyle, Engineering Manager reporting to Craig. Focus on team delivery, clarity, morale, tradeoffs, and execution. Reference GitHub issues/PR patterns, QCon stories, and practical tactical plans. Keep tone coach-like and pragmatic.`,
  Jordan: `You are Jordan, Software Engineer in a team of 5 under Kyle. Provide implementation-oriented advice, mention Stack Overflow / Reddit pain points, and include workarounds. Be candid, conversational, and reflect junior-to-mid developer concerns about learning curve and efficiency.`
};

async function generatePersonaText(persona, topic) {
  let systemPrompt = personaSystemPrompt[persona] || `You are ${persona}.`;
  let userPrompt = `Topic: ${topic}\n\nProduce 3-4 sentences with persona-specific considerations and one recommendation sentence.`;

  if (persona === 'Craig') {
    const topicLower = topic.toLowerCase();
    if (topicLower.includes('product') || topicLower.includes('pm') || topicLower.includes('discovery') || topicLower.includes('validation')) {
      const ragContext = await findRelevantContext(topic, 'product management', 3);
      if (ragContext) {
        systemPrompt += `\n\nYou have access to internal product management knowledge. When relevant, reference these insights: ${ragContext.context}`;
        userPrompt += `\n\nPlease incorporate relevant insights from the provided knowledge base.`;
        console.log(`RAG: Found ${ragContext.sources.length} sources for Craig on topic: ${topic}`);
      }
    }
  }

  if (!USE_LLM) {
    return {
      Craig: `Craig: LLM disabled; for '${topic}', prioritize ROI and scaling in a 5000-person org.`,
      Kyle: `Kyle: LLM disabled; break '${topic}' into small milestones and focus on team morale.`,
      Jordan: `Jordan: LLM disabled; prototype '${topic}' incrementally with tests and feedback loops.`
    }[persona] || `${persona}: ${topic}`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 250
    });

    return response.choices?.[0]?.message?.content?.trim() || `${persona}: Unable to generate response.`;
  } catch (err) {
    console.warn('LLM persona generation failed; fallback to local deterministic template:', err?.message || err);
    return {
      Craig: `Craig: LLM unavailable; for '${topic}', prioritize ROI and scaling in a 5000-person org.`,
      Kyle: `Kyle: LLM unavailable; handle '${topic}' by breaking it into small milestones and manage team morale.`,
      Jordan: `Jordan: LLM unavailable; implement '${topic}' using incremental demos and keep debugging notes for the team.`
    }[persona] || `${persona}: ${topic}`;
  }
}

async function generateConversation(topic) {
  const prompt = `You are simulating a conversation between Craig (Director of Engineering), Kyle (Engineering Manager), and Jordan (Software Engineer). Topic: ${topic}. Produce exactly 5 lines, each prefixed with the speaker name. No Product Manager is present. Include a clear next step or decision in the final line.`;

  if (!USE_LLM) {
    return [
      `Craig: LLM disabled; for '${topic}' keep it high-level and scaling focused.`,
      `Kyle: Simplify the plan, avoid burnout, and align to team capacity.`,
      `Jordan: Build a small prototype with tests and incremental rollout.`,
      `Craig: Keep enterprise metrics in mind and avoid over-specification.`,
      `Kyle: Schedule a 4-week pilot and follow up with a retrospective.`
    ].join('\n');
  }

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'You simulate realistic engineering team discussions.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 220
    });

    return response.choices?.[0]?.message?.content?.trim() || 'No conversation available.';
  } catch (err) {
    console.warn('LLM conversation generation failed; fallback to deterministic conversation:', err?.message || err);
    return [
      `Craig: Based on existing best practices, '${topic}' is worth piloting but avoid over-architecting.`,
      `Kyle: Prioritize clear milestones, avoid team burnout.`,
      `Jordan: Prototype with tests and iterate.`,
      `Craig: Keep org-level KPIs in focus.`,
      `Kyle: Execute a 4-week pilot and review.`
    ].join('\n');
  }
}


app.post('/api/evaluate-topic', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || topic.toString().trim().length === 0) {
      return res.status(400).json({ error: 'A topic is required.' });
    }

    const personas = ['Craig', 'Kyle', 'Jordan'];
    const personaPromises = personas.map((persona) => generatePersonaText(persona, topic));
    const [craigText, kyleText, jordanText] = await Promise.all(personaPromises);
    const conversation = await generateConversation(topic);

    return res.json({
      topic,
      personas: [
        { persona: 'Craig', text: craigText },
        { persona: 'Kyle', text: kyleText },
        { persona: 'Jordan', text: jordanText }
      ],
      conversation
    });
  } catch (error) {
    console.error('Agent generation error:', error);
    return res.status(500).json({ error: 'Failed to generate persona output', details: error?.message || error });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initializeKnowledgeBase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});
