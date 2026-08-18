from app.agents.gemini_client import async_ask_gemini
from app.services.rag_engine import rag_engine
from app.agents.orchestrator import run_agent_pipeline
from app.agents.language_detector import detect_language, get_language_instruction, get_language_example
import sys
import os
import asyncio

# Import training data
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'Training_data'))
try:
    from training_data import CLASSIFICATION_EXAMPLES, SENTIMENT_EXAMPLES, RESPONSE_TEMPLATES
except ImportError:
    CLASSIFICATION_EXAMPLES = ""
    SENTIMENT_EXAMPLES = ""
    RESPONSE_TEMPLATES = {}

# 🚀 HIGH-PERFORMANCE IN-MEMORY CACHE (Nanosecond retrieval)
_chat_cache = {}
CACHE_MAX_SIZE = 1000

# 📚 LOCAL FAQ KNOWLEDGE BASE (Zero-Latency Answers)
FAQ_KB = {
    "features": {
        "english": "• TelecomIQ is an AI-powered telecom complaint & analytics platform.\n• Select your category, submit details, and our AI assigns a specialist within 6 hours.\n• Track ticket status live on your dashboard or Support tab.",
        "hinglish": "• TelecomIQ ek AI-powered telecom complaint portal hai jo issues ko fast resolve karta hai.\n• Category select karein, details submit karein, 6 hours mein officer assign hoga.\n• Dashboard pe live status track karein.",
        "hindi": "• TelecomIQ एक AI-संचालित टेलीकॉम शिकायत समाधान पोर्टल है।\n• श्रेणी चुनें, विवरण दर्ज करें, 6 घंटे में अधिकारी नियुक्त होगा।\n• डैशबोर्ड पर लाइव स्थिति ट्रैक करें।"
    },
    "how_it_works": {
        "english": "• TelecomIQ automates complaint classification across 11 telecom domains.\n• Fill out the complaint form or chat with AI to generate a TC-ticket.\n• Support agents verify and resolve your issue within target SLA.",
        "hinglish": "• TelecomIQ aapke telecom complaint ko 11 categories mein classify karta hai.\n• Form fill karein ya AI chat se TC-ticket generate karein.\n• Dedicated team 6 hours mein resolution provide karegi.",
        "hindi": "• TelecomIQ 11 श्रेणियों में शिकायत का विश्लेषण और वर्गीकरण करता है।\n• फॉर्म भरें या एआई चैट द्वारा टीसी-टिकट प्राप्त करें।\n• टीम लक्ष्य समय के भीतर समाधान प्रदान करेगी।"
    },
    "tell_me_more": {
        "english": "• TelecomIQ uses an 8-stage AI engine: Domain Classifier, Sentiment Analyzer, Priority Scorer & RAG Vector Search.\n• Every complaint generates an SLA-tracked ticket (e.g. TC-20260819-XXXX).\n• Try submitting a test complaint or explore the 2,200+ dataset in Admin View!",
        "hinglish": "• TelecomIQ mein 11 telecom domains, sentiment scoring aur vector RAG matching hai.\n• Har complaint par unique ticket ID aur SLA duration milta hai.\n• Admin dashboard pe aap system ke saare 2,200+ records dekh sakte hain!",
        "hindi": "• टेलीकॉमआईक्यू 11 डोमेन, भावना विश्लेषण और आरएजी एसओपी का उपयोग करता है।\n• प्रत्येक शिकायत के लिए विशिष्ट टिकट आईडी और एसएलए जनरेट होता है।\n• आप एडमिन डैशबोर्ड पर सभी 2,200+ रिकॉर्ड देख सकते हैं!"
    },
    "what_saying": {
        "english": "• I'm your TelecomIQ Support Assistant!\n• You can file a complaint for 5G network, fiber broadband, or billing issues.\n• Or type your TC-Ticket ID to check live status!",
        "hinglish": "• Main TelecomIQ AI Support Agent hoon!\n• Aap network, broadband ya billing complaint file kar sakte hain.\n• Ya kisi ticket ka status check karne ke liye ticket ID enter karein!",
        "hindi": "• मैं टेलीकॉमआईक्यू सहायता एजेंट हूँ!\n• आप नेटवर्क, ब्रॉडबैंड या बिलिंग शिकायत दर्ज कर सकते हैं या टिकट आईडी से स्टेटस देख सकते हैं।"
    },
    "fake_response": {
        "english": "• TelecomIQ is a real operational AI system powered by Scikit-Learn ML and Groq Cloud LLMs!\n• Try filing a test complaint on the form to see our automated classification & SLA assignment in action.\n• You can also log into Admin view to inspect live system analytics.",
        "hinglish": "• TelecomIQ bilkul real system hai jo ML Classifier aur Groq AI LLM se powered hai!\n• Abhi complaint form se test ticket submit karke real-time AI resolution dekhein.\n• Admin dashboard login karke saare 2,200+ live records verify kar sakte hain!",
        "hindi": "• टेलीकॉमआईक्यू एमएल मॉडल और ग्रोक एलएलएम द्वारा संचालित एक वास्तविक प्रणाली है!\n• एआई समाधान देखने के लिए अभी एक परीक्षण शिकायत सबमिट करें।"
    },
    "thanks": {
        "english": "• You're welcome! Feel free to ask if you have any other telecom questions.\n• Have a wonderful day ahead!",
        "hinglish": "• Aapka swagat hai! Koi aur help chahiye ho toh zaroor bataiye.\n• Have a great day!",
        "hindi": "• आपका स्वागत है! यदि आपके कोई अन्य प्रश्न हैं तो बेझिझक पूछें।"
    }
}

def get_fast_faq_response(msg: str, lang: str) -> str:
    """Matches highly specific keywords to internal FAQ for instant response."""
    m = msg.lower()
    # Ticket status lookup detection
    import re
    if any(k in m for k in ["thanks", "thank you", "ok thanks", "dhanyawad", "shukriya", "thanku"]):
        return FAQ_KB["thanks"].get(lang, FAQ_KB["thanks"]["english"])
    if any(k in m for k in ["fake", "scam", "ur a so fake", "you are fake", "bot is fake"]):
        return FAQ_KB["fake_response"].get(lang, FAQ_KB["fake_response"]["english"])
    if any(k in m for k in ["what are you sayin", "what u sayin", "what are u saying", "not understanding", "samajh nahi"]):
        return FAQ_KB["what_saying"].get(lang, FAQ_KB["what_saying"]["english"])
    if any(k in m for k in ["tell me more", "more details", "explain more", "aur batao", "detail mein"]):
        return FAQ_KB["tell_me_more"].get(lang, FAQ_KB["tell_me_more"]["english"])
    if any(k in m for k in ["website features", "service highlights", "app features", "what is this site", "about this site", "what is this website", "what is this app", "how to use", "use this app", "kaise use", "what the hell"]):
        return FAQ_KB["features"].get(lang, FAQ_KB["features"]["english"])
    if any(k in m for k in ["how to complain", "complain kaise", "telecomiq work", "process of telecomiq"]):
        return FAQ_KB["how_it_works"].get(lang, FAQ_KB["how_it_works"]["english"])
    return None

async def handle_chat_message(message: str) -> dict:
    """
    Decides whether the message is a complaint (orchestrated) or a question.
    Optimized for 'Nano-Second' response speed using:
    1. In-memory caching
    2. Local Keyword FAQ matching
    3. Heuristic intent bypass
    """
    clean_msg = message.strip()
    msg_key = f"{clean_msg.lower()}"
    
    # 🏎️ TIER 0: CACHE HIT (Instant)
    if msg_key in _chat_cache:
        print("⚡ Cache Hit: Instant Response")
        return _chat_cache[msg_key]

    if not clean_msg:
        return {"role": "agent", "type": "info", "response": "How can I assist you today?"}

    # 🌐 LANGUAGE DETECTION (Local & Fast)
    user_language = detect_language(clean_msg)
    language_instruction = get_language_instruction(user_language)

    # 🚀 TIER 1: FAST PATH (Greetings)
    greetings_keywords = ["hi", "hello", "hey", "halo", "namaste", "salaam", "test", "hn", "ji", "ok", "acha", "hmm", "yo", "morning", "night", "sup", "greeting", "namas", "namaskar"]
    if (len(clean_msg) < 4 and clean_msg.lower() in greetings_keywords) or clean_msg.lower() in greetings_keywords:
        greetings = {
            'hinglish': "Hello! Main TelecomIQ AI Agent hoon. Main aapki kya help kar sakta hoon?",
            'hindi': "नमस्ते! मैं टेलीकॉमआईक्यू एआई एजेंट हूँ। मैं आपकी क्या मदद कर सकता हूँ?",
            'mixed': "Hi! I'm TelecomIQ AI Agent. Tell me how I can assist you today.",
            'english': "Hello! How can I assist you today? Feel free to file a complaint or ask about our telecom services."
        }
        print(f"🌐 Detected Language: {user_language}")
        res = {"role": "agent", "type": "info", "response": greetings.get(user_language, greetings['english']), "language": user_language}
        _chat_cache[msg_key] = res
        return res

    # 🚀 TIER 1.5: REAL TICKET DB LOOKUP (Instant DB Query)
    import re
    ticket_match = re.search(r'TC-[A-Z0-9-]+', clean_msg, re.IGNORECASE)
    if ticket_match:
        ticket_id = ticket_match.group(0).upper()
        try:
            from app.db.database import SessionLocal
            from app.db.models import Complaint
            db = SessionLocal()
            comp = db.query(Complaint).filter(Complaint.ticket_id.ilike(f"%{ticket_id}%")).first()
            db.close()
            if comp:
                status_str = "RESOLVED" if comp.is_resolved else "PENDING (In Technical Review)"
                res_text = (
                    f"• Ticket Located: {comp.ticket_id} ({comp.category} | Priority: {comp.priority})\n"
                    f"• Status: {status_str}\n"
                    f"• Registered Subject: {comp.subject or 'Telecom Incident'}\n"
                    f"• Assigned Solution / Action: {comp.solution or comp.action or 'Line status under active engineering review.'}"
                )
                return {"role": "agent", "type": "info", "response": res_text, "language": user_language}
            else:
                return {
                    "role": "agent",
                    "type": "info",
                    "response": f"• Ticket {ticket_id} was not found in our live database.\n• Please double-check the ticket number or submit a new complaint using the form!",
                    "language": user_language
                }
        except Exception as e:
            print(f"❌ Ticket lookup error: {e}")

    # 🚀 TIER 2: LOCAL FAQ (No API latency)
    faq_res = get_fast_faq_response(clean_msg, user_language)
    if faq_res:
        res = {"role": "agent", "type": "info", "response": faq_res}
        _chat_cache[msg_key] = res
        return res

    # 🚀 TIER 3: HEURISTIC INTENT (Skip LLM for obvious complaints)
    complaint_markers = ["wrong", "issue", "bug", "broken", "failed", "error", "delay", "not working", "kharab", "galat", "problem", "paisay", "refund", "not received", "bekar"]
    if any(marker in clean_msg.lower() for marker in complaint_markers):
        intent = "COMPLAINT"
    else:
        # Fast intent detection with low timeout
        question_words = ["how", "what", "where", "who", "when", "why", "kya", "kaise", "kab", "kahan", "kyun", "kyu", "can", "is", "does", "provide"]
        contains_question = any(word in clean_msg.lower() for word in question_words) or "?" in clean_msg
        
        intent = "QUESTION"
        if not contains_question or len(clean_msg) > 60:
            try:
                # Using short timeout for intent
                intent_prompt = f"Categorize as ONE word: COMPLAINT or QUESTION. Message: {clean_msg}"
                intent_res = await asyncio.wait_for(async_ask_gemini(intent_prompt), timeout=3.0)
                intent = intent_res.upper()
            except:
                intent = "QUESTION"

    # 🚀 TIER 4: AI PROCESSING (Language-Aware & Versatile)
    if "QUESTION" in intent:
        # 🔍 TIER 3.5: RAG RETRIEVAL (Company Policies)
        policy_context = rag_engine.retrieve(clean_msg)
        
        system_persona = f"""You are TelecomIQ AI Agent, a helpful, precise telecom assistant.

RULES:
- Provide ONLY 2-3 short bullet points (under 50 words total).
- Respond directly to the user in {user_language.upper()} language.
- DO NOT output thinking steps, mental refinements, draft notes, word count checks, or prompt instructions."""
        
        answer_prompt = f"""{system_persona}

User Message: {clean_msg}

Response ({user_language.upper()} bullets only):"""
        try:
            print(f"🌐 Master AI Processing - Language: {user_language}")
            raw_answer = await asyncio.wait_for(async_ask_gemini(answer_prompt), timeout=8.0)
            import re
            # Strip think tags, reasoning logs, and prompt-engineering leaks
            cleaned_answer = re.sub(r'<think>.*?</think>', '', raw_answer, flags=re.DOTALL | re.IGNORECASE)
            cleaned_answer = re.sub(r"Here's a thinking process:.*?(?=\n\n|\n[•*-]|\Z)", '', cleaned_answer, flags=re.DOTALL | re.IGNORECASE)
            cleaned_answer = re.sub(r'(?:^\d+\.\s+Analyze User Input:|\bAnalyze User Input:|\bDraft - Mental Refinement|\bCheck Constraints:|\bSelf-Correction|\bOutput Generation|\bIdentify Key Requirements:).*?(?=\n[•*-]|\Z)', '', cleaned_answer, flags=re.DOTALL | re.IGNORECASE)
            cleaned_answer = re.sub(r'^(?:AI RESPONSE|RESPONSE).*?:\s*', '', cleaned_answer, flags=re.IGNORECASE).strip()

            answer = cleaned_answer if cleaned_answer else raw_answer.strip()
            res = {"role": "agent", "type": "info", "response": answer, "language": user_language}
            _chat_cache[msg_key] = res
            return res
        except Exception as e:
            print(f"❌ AI Chat Error: {e}")
            fallback = {
                'hinglish': "Maaf kijiye, main abhi busy hoon. Aap complaint form submit kar sakte hain!",
                'hindi': "क्षमा करें, मैं अभी व्यस्त हूँ। कृपया शिकायत फॉर्म का उपयोग करें!",
                'english': "Apologies, I'm currently experiencing high load. Please use the complaint form!"
            }
            return {"role": "agent", "type": "info", "response": fallback.get(user_language, fallback['english']), "language": user_language}

    # 🚀 TIER 5: COMPLAINT PIPELINE
    try:
        result = await asyncio.wait_for(
            run_agent_pipeline(clean_msg, user_language=user_language),
            timeout=15.0
        )
        
        category = result["category"]
        priority = result["priority"]
        templated_response = RESPONSE_TEMPLATES.get(category, {}).get(priority)
        final_response = templated_response if (templated_response and len(clean_msg) < 50) else result["response"]

        final_res = {
            "role": "agent",
            "type": "complaint",
            "category": result["category"],
            "priority": result["priority"],
            "response": final_response,
            "action": result["action"],
            "sentiment": result.get("sentiment", "Neutral"),
            "solution": result.get("solution", ""),
            "satisfaction": result.get("satisfaction", "Medium"),
            "similar_issues": result.get("similar_issues", ""),
            "steps": result.get("steps", []),
            "language": user_language
        }
        
        # Cache and rotate if full
        if len(_chat_cache) > CACHE_MAX_SIZE:
            _chat_cache.pop(next(iter(_chat_cache)))
        _chat_cache[msg_key] = final_res
        
        return final_res
    except Exception as e:
        print(f"❌ Chat Pipeline Error: {e}")
        return {"role": "agent", "type": "info", "response": "Something went wrong. Please try again."}

