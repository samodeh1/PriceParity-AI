PriceParity AI Dashboard (client/public/dashboard.png)

PriceParity AI – Global Revenue Optimization Engine
PriceParity AI is an intelligent, Generative AI platform that helps digital creators and SaaS founders scale their sales globally. By leveraging Purchasing Power Parity (PPP) data, the app automatically adjusts product pricing for different economies and uses OpenAI to generate culturally-relevant marketing copy.
🚀 Live Application
🛠️ The Professional Stack
Frontend: React 18 (Vite) + TypeScript
Styling: Tailwind CSS (Luxury/Minimalist UI)
Backend: Node.js & Express (RESTful Architecture)
Database: MongoDB Atlas (Cloud NoSQL)
AI Integration: OpenAI API (GPT-4o-mini / Luna)
FinTech: Paystack Global (Secure Payments)
Auth: Google OAuth 2.0 & JWT-based sessions
🌟 Key Business Features
Dynamic PPP Engine: Automatically calculates suggested prices for 20+ countries (Nigeria, India, Brazil, etc.) based on local economic strength.
Generative AI Localization: Uses OpenAI to rewrite sales pitches specifically for the target market's culture and currency (e.g., automatically converting $USD to ₦Naira).
Pro-Tier Monetization: Integrated a "Pay-to-Unlock" model. Users must upgrade to Pro via Paystack to access the AI engine and the Website Widget.
Security-First Architecture:
Idle Session Management: Auto-logs users out after 15 minutes of inactivity for data protection.
Environment Shielding: Securely handles sensitive API keys via Render and Vercel environments.
Embedded Website Widget: Provides a copy-paste script that creators can use to show localized prices on their own websites.
Persistent Strategy History: Logged-in users can access a history of every global strategy they have generated.
🧠 Engineering Challenges Solved
Cross-Origin Security: Managed COOP (Cross-Origin Opener Policy) headers to allow secure communication between Google OAuth popups and the React application.
State Synchronization: Built a profile-sync logic that verifies "Pro" status directly from the database on every page refresh, preventing local storage manipulation.
Currency Accuracy: Implemented manual exchange rate logic combined with AI creativity to eliminate "AI hallucinations" in financial data.
⚙️ Installation (Monorepo)
Clone & Install:
code
Bash
git clone https://github.com/samodeh1/PriceParity-AI.git
cd PriceParity-AI

# Install Client

cd client && npm install

# Install Server

cd ../server && npm install
Environment Variables (.env):
Create a .env in the /server folder with:
MONGO_URI, JWT_SECRET, OPENAI_API_KEY, PAYSTACK_SECRET_KEY, CLIENT_URL
Run Dev Mode:
code
Bash

# From Root

cd server && npm run dev
cd client && npm run dev
👤 Author
Samuel Odeh
Fullstack Software Engineer | SaaS Founder
Portfolio: www.richtec.com.ng
LinkedIn: Connect with me
