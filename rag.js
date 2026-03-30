require('dotenv').config();
const cheerio = require('cheerio');

const knowledgeBase = {
  articles: [
    {
      id: 'mom-test',
      url: 'https://medium.com/@poloniothais/book-summary-the-mom-test-by-rob-fitzpatrick-8440986cd92c',
      topic: 'product management',
      title: 'The Mom Test'
    },
    {
      id: 'inspired',
      url: 'https://t-ziegelbecker.medium.com/a-summary-of-inspired-by-marty-cagan-9d94e1eeb4bd',
      topic: 'product management',
      title: 'Inspired by Marty Cagan'
    }
  ],
  chunks: [],
  fallbackContent: {
    'mom-test': `The Mom Test by Rob Fitzpatrick teaches how to talk to customers about your business idea without them lying to be nice. The core principle is to ask about specific past behaviors rather than hypothetical opinions or generic feedback about your idea. Instead of asking "Would you use a product that does X?" which invites false positivity, ask about specific problems they had recently, what they did to solve it, and how much they paid for existing solutions. If you're not embarrassed by your mother's reaction to your pitch, you haven't asked hard enough questions. The book emphasizes that customer conversations should focus on learning about their actual problems and behaviors, not pitch validation.`,
    'inspired': `Inspired by Marty Cagan is about how tech companies build products that matter. Product discovery is about finding a valuable, usable, and feasible product before building it. The job of a product manager is to discover a product that customers love, can be built by engineering, and delivers business value. Startups exist to search for a business model, not execute one. The inspired product team consists of product manager, designer, and engineers working together. Without authority, product managers must influence through persuasion and data. The seven core skills include deep user understanding, ability to abstract from specific solutions, making money, technical literacy, bias toward action, collaboration, and communication.`
  }
};

async function fetchUrlContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    $('script, style, nav, header, footer, aside, .advertisement, .ad, .sidebar, .comments').remove();
    
    let text = $('body').text();
    text = text.replace(/\s+/g, ' ').trim();
    text = text.substring(0, 8000);
    
    return text;
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error.message);
    return null;
  }
}

function getKeywords(text) {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then', 'if', 'as', 'from', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'once', 'about', 'out', 'up', 'down', 'off', 'over', 'any', 'because', 'until', 'while', 'show', 'like', 'get', 'make', 'go', 'know', 'take', 'see', 'come', 'think', 'look', 'want', 'use', 'find', 'give', 'tell', 'try', 'leave', 'call', 'need', 'feel', 'become', 'back', 'still', 'well', 'even', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'old', 'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important', 'public', 'good', 'bad', 'best', 'better', 'sure', 'thing', 'things', 'way', 'ways', 'people', 'time', 'times', 'year', 'years', 'day', 'days', 'point', 'fact', 'matter', 'kind', 'world', 'life', 'child', 'children', 'case', 'week', 'weeks', 'company', 'system', 'program', 'question', 'government', 'number', 'night', 'work', 'part', 'place', 'side', 'person', 'week', 'hand', 'area', 'story', 'lot', 'line', 'job', 'word', 'business', 'issue', 'side', 'kind', 'head', 'group', 'problem', 'state', 'team', 'idea', 'end', 'member', 'law', 'car', 'city', 'name', 'president', 'room', 'market', 'policy', 'process', 'field', 'development', 'role', 'effect', 'use', 'class', 'control', 'care', 'level', 'move', 'help', 'game', 'power', 'case', 'must', 'information', 'country', 'music', 'note', 'paper', 'book', 'health', 'message', 'view', 'door', 'light', 'office', 'table', 'start', 'human', 'report', 'result', 'reason', 'road', 'article', 'size', 'dog', 'cart', 'product', 'customer', 'learning', 'data', 'value', 'real', 'top', 'research', 'contact', 'screen', 'price', 'cost', 'money', 'type', 'collection', 'attention', 'decision', 'post', 'comment', 'discussion', 'foundation', 'task', 'energy', 'future', 'interest', 'truth', 'term', 'summer', 'film', 'body', 'action', 'age', 'art', 'change', 'history', 'report', 'money', 'picture', 'practice', 'price', 'science', 'income', 'chair', 'director', 'device', 'experience', 'far', 'feature', 'food', 'force', 'floor', 'form', 'friend', 'front', 'glass', 'gold', 'ground', 'hair', 'hardware', 'hearing', 'house', 'image', 'insurance', 'issue', 'judgment', 'language', 'learning', 'leader', 'letter', 'light', 'loss', 'machine', 'management', 'material', 'meeting', 'mind', 'model', 'money', 'monitor', 'mortgage', 'mouth', 'noise', 'notice', 'oil', 'operation', 'option', 'order', 'others', 'output', 'ownership', 'parent', 'parking', 'party', 'payment', 'peace', 'phone', 'photo', 'picture', 'piece', 'plant', 'player', 'plus', 'poll', 'pool', 'population', 'position', 'possibility', 'pot', 'pressure', 'proof', 'purpose', 'quality', 'range', 'rate', 'reader', 'reading', 'reality', 'recipe', 'record', 'reduction', 'reflection', 'regard', 'region', 'relation', 'reply', 'response', 'rest', 'rice', 'ring', 'risk', 'rock', 'role', 'roof', 'room', 'rule', 'salt', 'sample', 'sand', 'save', 'scheme', 'search', 'season', 'seat', 'secret', 'sector', 'seed', 'sense', 'series', 'server', 'sex', 'shape', 'shirt', 'shock', 'sight', 'sign', 'signal', 'significance', 'silence', 'silver', 'singer', 'site', 'size', 'skill', 'sky', 'sleep', 'smile', 'smoke', 'snow', 'software', 'soil', 'solution', 'soup', 'source', 'space', 'speaker', 'speech', 'spirit', 'sport', 'spot', 'spring', 'square', 'stage', 'stake', 'standard', 'star', 'start', 'statement', 'station', 'status', 'steel', 'step', 'stick', 'stock', 'stone', 'storage', 'store', 'storm', 'stranger', 'stream', 'street', 'stress', 'strike', 'string', 'strip', 'stroke', 'structure', 'stuff', 'style', 'sugar', 'suggestion', 'suit', 'supply', 'survey', 'switch', 'symbol', 'table', 'taste', 'teaching', 'test', 'theory', 'thing', 'thought', 'thousand', 'threat', 'throw', 'tie', 'tip', 'title', 'toe', 'tomorrow', 'tonight', 'tooth', 'topic', 'total', 'touch', 'tour', 'tower', 'track', 'trade', 'traffic', 'train', 'trash', 'treatment', 'tree', 'trial', 'trip', 'trouble', 'truck', 'trust', 'try', 'tube', 'turn', 'type', 'unit', 'user', 'variety', 'video', 'virus', 'visit', 'voice', 'volume', 'vote', 'wage', 'wait', 'wake', 'walk', 'wall', 'war', 'wash', 'watch', 'wave', 'way', 'weakness', 'wealth', 'weapon', 'wear', 'weather', 'web', 'wedding', 'week', 'weight', 'wheel', 'wife', 'wild', 'will', 'wind', 'window', 'wine', 'wing', 'winner', 'winter', 'wire', 'wish', 'witness', 'woman', 'wonder', 'wood', 'word', 'worker', 'writing', 'yard', 'year', 'zero', 'zone', 'product', 'manager', 'customer', 'user', 'problem', 'solution', 'test', 'market', 'validate', 'hypothesis', 'interview', 'talk', 'feedback', 'learn', 'insight', 'metric', 'measurement', 'outcome', 'output', 'vision', 'strategy', 'roadmap', 'prioritize', 'opportunity', 'risk', 'MVP', 'prototype', 'experiment', 'data', 'insight', 'customer', 'discovery']);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  return words.filter(w => w.length > 2 && !stopWords.has(w));
}

function keywordScore(query, chunkText) {
  const queryKeywords = getKeywords(query);
  const chunkKeywords = getKeywords(chunkText);
  const chunkSet = new Set(chunkKeywords);
  let score = 0;
  for (const kw of queryKeywords) {
    if (chunkSet.has(kw)) score += 1;
  }
  return score / Math.max(queryKeywords.length, 1);
}

async function initializeKnowledgeBase() {
  console.log('Initializing RAG knowledge base...');
  
  for (const article of knowledgeBase.articles) {
    let content = await fetchUrlContent(article.url);
    
    if (!content || content.length < 200) {
      console.log(`Scraping failed for ${article.title}, using fallback content`);
      content = knowledgeBase.fallbackContent[article.id] || '';
    }
    
    if (content) {
      const sentences = content.split(/(?<=[.!?])\s+/);
      const chunks = [];
      for (let i = 0; i < sentences.length; i += 3) {
        const chunk = sentences.slice(i, i + 3).join(' ');
        if (chunk.length > 50) {
          chunks.push(chunk);
        }
      }
      
      for (const chunkText of chunks) {
        knowledgeBase.chunks.push({
          articleId: article.id,
          topic: article.topic,
          title: article.title,
          url: article.url,
          text: chunkText
        });
      }
      console.log(`Indexed: ${article.title} (${chunks.length} chunks)`);
    }
  }
  console.log(`Knowledge base initialized with ${knowledgeBase.chunks.length} chunks`);
}

async function findRelevantContext(query, topic = 'product management', topK = 3) {
  const topicLower = query.toLowerCase();
  const isProductTopic = topicLower.includes('product') || topicLower.includes('pm') || 
                        topicLower.includes('discovery') || topicLower.includes('validation') ||
                        topicLower.includes('customer') || topicLower.includes('user') ||
                        topicLower.includes('market') || topicLower.includes('hypothesis');
  
  if (!isProductTopic) return null;
  
  const scored = knowledgeBase.chunks
    .filter(chunk => chunk.topic === topic)
    .map(chunk => ({
      ...chunk,
      score: keywordScore(query, chunk.text)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  
  if (scored.length === 0 || scored[0].score < 0.1) return null;
  
  return {
    context: scored.map(s => s.text).join('\n\n'),
    sources: [...new Set(scored.map(s => ({ title: s.title, url: s.url })))]
  };
}

module.exports = {
  initializeKnowledgeBase,
  findRelevantContext,
  knowledgeBase
};
