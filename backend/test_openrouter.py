import os
import json
import requests

def load_env_manually():
    """Load variables from .env file if present, without relying on python-dotenv."""
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        print(f"Loading environment from {env_path}...")
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        key, val = line.split('=', 1)
                        # Remove quotes if present
                        val = val.strip().strip("'").strip('"')
                        os.environ[key.strip()] = val
    else:
        print("No .env file found in current directory. Using system environment variables.")

def test_with_requests(api_key, model):
    print("\n--- Testing OpenRouter API with 'requests' library ---")
    
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Resume Analyzer Local Test",
    }
    
    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": "Respond with a 1-sentence greeting and confirm you are online."
            }
        ],
        "max_tokens": 50
    }
    
    print(f"Sending request to: {url}")
    print(f"Using model: {model}")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        print(f"HTTP Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            # Try to extract the response message
            try:
                reply = data['choices'][0]['message']['content']
                print("\nSuccess! OpenRouter API Response:")
                print(f"Reply: {reply}")
                print(f"Usage: {data.get('usage', {})}")
                return True
            except (KeyError, IndexError) as e:
                print(f"Failed to parse response JSON: {e}")
                print(f"Response data: {json.dumps(data, indent=2)}")
                return False
        else:
            print(f"Error: Received status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"An error occurred during requests test: {e}")
        return False

def test_with_openai_sdk(api_key, model):
    print("\n--- Testing OpenRouter API with 'openai' SDK ---")
    
    # Temporarily remove proxy environment variables that might trigger SDK bugs
    proxy_keys = ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"]
    saved_proxies = {}
    for key in proxy_keys:
        if key in os.environ:
            saved_proxies[key] = os.environ[key]
            del os.environ[key]
            
    try:
        import openai
        print(f"openai library version: {openai.__version__}")
        
        # Check SDK version to handle v0.x vs v1.x+ API difference
        is_modern = hasattr(openai, "OpenAI")
        
        if is_modern:
            print("Using modern OpenAI SDK (v1.0.0+)")
            client = openai.OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=api_key,
            )
            completion = client.chat.completions.create(
                extra_headers={
                    "HTTP-Referer": "http://localhost:8000",
                    "X-Title": "Resume Analyzer Local Test",
                },
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": "Respond with a 1-sentence confirmation that the OpenAI SDK works."
                    }
                ],
                max_tokens=50
            )
            print("\nSuccess! OpenAI SDK Response:")
            print(f"Reply: {completion.choices[0].message.content}")
        else:
            print("Using legacy OpenAI SDK (<v1.0.0)")
            openai.api_base = "https://openrouter.ai/api/v1"
            openai.api_key = api_key
            
            completion = openai.ChatCompletion.create(
                model=model,
                headers={
                    "HTTP-Referer": "http://localhost:8000",
                    "X-Title": "Resume Analyzer Local Test",
                },
                messages=[
                    {
                        "role": "user",
                        "content": "Respond with a 1-sentence confirmation that the legacy OpenAI SDK works."
                    }
                ],
                max_tokens=50
            )
            print("\nSuccess! Legacy OpenAI SDK Response:")
            print(f"Reply: {completion['choices'][0]['message']['content']}")
        return True
        
    except ImportError:
        print("The 'openai' library is not installed. Skipping SDK test.")
        print("If you want to use it, you can install it using: pip install openai")
        return False
    except Exception as e:
        print(f"An error occurred during OpenAI SDK test: {e}")
        return False
    finally:
        # Restore proxy environment variables
        for key, val in saved_proxies.items():
            os.environ[key] = val

def main():
    print("========================================")
    print("     OpenRouter API Connection Test    ")
    print("========================================")
    
    # 1. Load configuration
    load_env_manually()
    
    api_key = os.getenv("OPENROUTER_API_KEY")
    model = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")
    
    if not api_key:
        print("\n[ERROR] OPENROUTER_API_KEY not found in .env file or environment!")
        print("Please check your .env file or set the OPENROUTER_API_KEY environment variable.")
        return
        
    # Mask API key for logs
    masked_key = api_key
    if len(api_key) > 10:
        masked_key = f"{api_key[:10]}...{api_key[-6:]}"
        
    print(f"\nConfiguration loaded:")
    print(f"  API Key: {masked_key}")
    print(f"  Model:   {model}")
    
    # 2. Run tests
    requests_success = test_with_requests(api_key, model)
    
    sdk_success = test_with_openai_sdk(api_key, model)
    
    print("\n========================================")
    print("              Test Summary              ")
    print("========================================")
    print(f"Requests test: {'PASSED' if requests_success else 'FAILED'}")
    print(f"OpenAI SDK test: {'PASSED' if sdk_success else 'SKIPPED/FAILED'}")
    print("========================================")

if __name__ == "__main__":
    main()
