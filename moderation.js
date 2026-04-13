const { RegExpMatcher, TextCensor, englishDataset, englishRecommendedTransformers } = require('obscenity');

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const unsafeKeywords = [
  'hack', 'exploit', 'ddos', 'spam', 'phishing', 'malware', 'virus',
  'bypass', 'crack', 'stolen', 'steal', 'illegal', 'fraud', 'scam',
  'bomb', 'attack', 'threat', 'kill', 'suicide', 'harm', 'abuse',
  'racist', 'sexist', 'homophobic', 'nazi', 'hate', 'harass'
];

const safeTemplates = {
  toxicity: "Let's keep our conversation professional and constructive. How can I help you with a software engineering topic?",
  profanity: "Please keep things civil. I'm here to help with engineering discussions - what would you like to explore?",
  unsafe: "I can't help with that request. Is there a software development topic I can assist you with instead?",
  default: "Let's please stay professional here. What software engineering topic can I help you with?"
};

function detectUnsafeIntent(text) {
  const lower = text.toLowerCase();
  const matches = unsafeKeywords.filter(kw => lower.includes(kw));
  if (matches.length > 0) {
    return { detected: true, keywords: matches };
  }
  return { detected: false, keywords: [] };
}

function moderateInput(text) {
  if (!text || typeof text !== 'string') {
    return { safe: true, reason: null, details: null };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { safe: false, reason: 'empty', details: 'Input cannot be empty' };
  }

  const hasProfanity = matcher.hasMatch(trimmed);
  const profanityMatches = hasProfanity ? matcher.getAllMatches(trimmed).map(m => m.text) : [];
  
  const intentCheck = detectUnsafeIntent(trimmed);
  
  if (hasProfanity) {
    return {
      safe: false,
      reason: 'profanity',
      details: profanityMatches,
      response: safeTemplates.profanity
    };
  }
  
  if (intentCheck.detected) {
    return {
      safe: false,
      reason: 'unsafe_intent',
      details: intentCheck.keywords,
      response: safeTemplates.unsafe
    };
  }

  return { safe: true, reason: null, details: null };
}

module.exports = {
  moderateInput,
  matcher
};