# mini-dev-org-app
As a Product manager, my intent for this AI agent was to practice Developer empathy and AI building skills. 

This agent allows a user to discuss a topic with a Developer team consisting of 3 Developer personas: a junior SDE, an Engineering Manager, and a Director of Engineering. The user can type in a topic and see responses from each persona, as well as a 5-line conversation among them without a Product Manager in the room. The Developer personas are somewhat modelled off the real Developers that I worked with (all names are different from the real people), but mostly ChatGPT suggestions. Developer personas are trained on the following data sources:

 <img width="466" height="215" alt="image" src="https://github.com/user-attachments/assets/d3b9d578-f6e7-464c-9d4e-447be021bd4a" />

I also practiced RAG by adding context from some books that a Director of Engineering might have read on product topics (The Mom Test, Inspired).

I further added an input moderation layer to make the agent safer:
Profanity detection using obscenity library (handles leetspeak, obfuscation)
Unsafe intent detection for keywords like hack, exploit, malware, phishing, etc.
Safe response templates - returns professional fallback messages instead of raw prompts

Example responses:
Profanity input → "Please keep things civil. I'm here to help with engineering discussions..."
Unsafe intent → "I can't help with that request. Is there a software development topic I can assist you with instead?"

The high-level architecture:

 <img width="256" height="237" alt="image" src="https://github.com/user-attachments/assets/2c6250bd-96b5-46fb-bc04-6b8741afb827" />

I used ChatGPT and OpenCode to build the agent with Groq LLM, Render API, and npm obsenity library.
