import os
from dotenv import load_dotenv
from groq import AsyncGroq
from typing import Optional, List

load_dotenv()

class GroqClient:
    """
    Groq API Client with Multi-Model Fallback
    Automatically tries multiple models if one fails
    """
    
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        
        # Comprehensive list of 20+ Groq models (in order of preference)
        # Organized by capability: Best Quality → Balanced → Fast → Ultra-Fast
        self.models: List[str] = [
            # === TIER 1: ACTIVE GROQ MODELS (2025/2026 API Spec) ===
            "qwen/qwen3.6-27b",                 # 1. High quality reasoning model
            "groq/compound-mini",               # 2. Ultra-fast compound model
            "openai/gpt-oss-20b",               # 3. Open-weights fast model
            "groq/compound",                    # 4. High-performance compound model
            "openai/gpt-oss-120b",              # 5. Large scale model
            "allam-2-7b",                       # 6. Balanced 7B model
        ]

        # Cap how many models we try before giving up so a rate-limited or
        # degraded Groq endpoint fails over to Gemini/local quickly instead of
        # grinding through every model sequentially.
        self.max_fallback_attempts = 4
        
        # Track which models have failed
        self.failed_models = set()
        self.current_model_index = 0
        
        if self.api_key:
            # Async client with a per-request timeout of 15.0 seconds
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
            
            # If this model hasn't failed, use it
            if self.current_model_index not in self.failed_models:
                return model
            
            # Move to next model
            self.current_model_index = (self.current_model_index + 1) % len(self.models)
            attempts += 1
        
        # All models failed - reset and try again
        print("⚠️ All Groq models exhausted. Resetting...")
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
        Tries multiple models until one succeeds
        """
        if not self.client:
            return None

        max_attempts = min(len(self.models), self.max_fallback_attempts)

        for attempt in range(max_attempts):
            current_model = self.get_next_model()
            
            if not current_model:
                print("❌ No Groq models available")
                return None
            
            try:
                print(f"🚀 Trying Groq model: {current_model} (attempt {attempt + 1}/{max_attempts})")
                
                # Groq API call with optimized parameters (async — non-blocking)
                chat_completion = await self.client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert customer support specialist. Provide detailed, empathetic, and professional responses. Always be specific with timelines and action steps."
                        },
                        {
                            "role": "user",
                            "content": prompt,
                        }
                    ],
                    model=current_model,
                    temperature=0.8,  # Higher for more creative, human-like responses
                    max_tokens=max_tokens,
                    top_p=0.95,  # Slightly lower for more focused responses
                    frequency_penalty=0.2,  # Reduce repetition
                    presence_penalty=0.1,  # Encourage diverse vocabulary
                    stream=False,
                )
                
                response = chat_completion.choices[0].message.content
                
                if response and response.strip():
                    import re
                    cleaned_res = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL | re.IGNORECASE)
                    cleaned_res = re.sub(r"Here's a thinking process:.*?(?=\n\n|\n[•*-]|\Z)", '', cleaned_res, flags=re.DOTALL | re.IGNORECASE)
                    cleaned_res = re.sub(r'(?:^\d+\.\s+Analyze User Input:|\bAnalyze User Input:|\bDraft - Mental Refinement|\bCheck Constraints:|\bSelf-Correction|\bOutput Generation|\bIdentify Key Requirements:).*?(?=\n[•*-]|\Z)', '', cleaned_res, flags=re.DOTALL | re.IGNORECASE)
                    cleaned_res = re.sub(r'^(?:AI RESPONSE|RESPONSE).*?:\s*', '', cleaned_res, flags=re.IGNORECASE).strip()
                    if cleaned_res:
                        print(f"✅ Groq success with model: {current_model}")
                        return cleaned_res
                    return response.strip()
                
                # Empty response - try next model
                print(f"⚠️ Empty response from {current_model}, trying next model...")
                self.mark_model_failed()
                continue
                
            except Exception as e:
                error_msg = str(e).lower()
                
                # Check if it's a model-specific error
                if "decommissioned" in error_msg or "not found" in error_msg or "invalid" in error_msg:
                    print(f"⚠️ Model {current_model} unavailable: {e}")
                    self.mark_model_failed()
                    
                    # Try next model
                    if attempt < max_attempts - 1:
                        continue
                
                # Check if it's a rate limit error
                elif "rate limit" in error_msg or "429" in error_msg:
                    print(f"⚠️ Rate limit hit on {current_model}")
                    self.mark_model_failed()
                    
                    # Try next model
                    if attempt < max_attempts - 1:
                        continue
                
                else:
                    print(f"⚠️ Groq error with {current_model}: {e}")
                    self.mark_model_failed()
                    
                    # Try next model
                    if attempt < max_attempts - 1:
                        continue
        
        print("❌ All Groq models failed")
        return None

# Global instance
groq_client = GroqClient()
