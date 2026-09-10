import os
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from groq import AsyncGroq
from typing import Optional, List

load_dotenv()

class GroqClient:
    """
    Groq API Client with Multi-Model Fallback.
    Automatically tries multiple Groq models if one encounters rate limits or errors.
    """
    
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        
        # Models in order of reasoning capability & speed (Active for this Groq API Key)
        self.models: List[str] = [
            "qwen/qwen3.6-27b",
            "groq/compound",
            "groq/compound-mini",
            "openai/gpt-oss-120b",
            "openai/gpt-oss-20b"
        ]

        self.max_fallback_attempts = 4
        self.failed_models = set()
        self.current_model_index = 0
        
        if self.api_key:
            self.client = AsyncGroq(api_key=self.api_key, timeout=15.0, max_retries=0)
            print(f"✅ Groq API initialized with {len(self.models)} fallback models")
            print(f"🎯 Primary model: {self.models[0]}")
        else:
            self.client = None
            print("⚠️ GROQ_API_KEY not set - Groq will be skipped")
    
    def get_next_model(self) -> Optional[str]:
        """Get the next available model that hasn't failed"""
        attempts = 0
        while attempts < len(self.models):
            model = self.models[self.current_model_index]
            if self.current_model_index not in self.failed_models:
                return model
            self.current_model_index = (self.current_model_index + 1) % len(self.models)
            attempts += 1
        
        # Reset failed set if all exhausted
        self.failed_models.clear()
        self.current_model_index = 0
        return self.models[0] if self.models else None
    
    def mark_model_failed(self):
        """Mark current model as failed and move to next"""
        self.failed_models.add(self.current_model_index)
        print(f"❌ Groq model #{self.current_model_index + 1} ({self.models[self.current_model_index]}) failed")
        self.current_model_index = (self.current_model_index + 1) % len(self.models)
    
    async def generate(self, prompt: str, max_tokens: int = 2048) -> Optional[str]:
        """
        Generate response using Groq API with automatic model fallback
        """
        if not self.client:
            return None

        max_attempts = min(len(self.models), self.max_fallback_attempts)

        for attempt in range(max_attempts):
            current_model = self.get_next_model()
            
            if not current_model:
                return None
            
            try:
                chat_completion = await self.client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": "You are TelecomIQ's expert telecom support specialist. Provide detailed, empathetic, and professional technical responses."
                        },
                        {
                            "role": "user",
                            "content": prompt,
                        }
                    ],
                    model=current_model,
                    temperature=0.7,
                    max_tokens=max_tokens,
                    top_p=0.95,
                )
                
                response = chat_completion.choices[0].message.content
                
                if response and response.strip():
                    import re
                    cleaned_res = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL | re.IGNORECASE)
                    cleaned_res = re.sub(r"Here's a thinking process:.*?(?=\n\n|\n[•*-]|\Z)", '', cleaned_res, flags=re.DOTALL | re.IGNORECASE)
                    cleaned_res = re.sub(r'^(?:AI RESPONSE|RESPONSE).*?:\s*', '', cleaned_res, flags=re.IGNORECASE).strip()
                    if cleaned_res:
                        return cleaned_res
                    return response.strip()
                
                self.mark_model_failed()
                continue
                
            except Exception as e:
                print(f"❌ Groq model '{current_model}' error: {type(e).__name__} - {e}")
                self.mark_model_failed()
                if attempt < max_attempts - 1:
                    continue
        
        return None

# Global instance
groq_client = GroqClient()

async def async_ask_ai(prompt: str, max_tokens: int = 2048) -> str:
    """
    Standard AI generation entry point for all agents using Groq.
    """
    res = await groq_client.generate(prompt, max_tokens=max_tokens)
    if res and res.strip():
        return res.strip()
    raise Exception("Groq AI unavailable — triggering local fallback")

async def async_ask_groq(prompt: str, max_tokens: int = 2048) -> str:
    return await async_ask_ai(prompt, max_tokens=max_tokens)
