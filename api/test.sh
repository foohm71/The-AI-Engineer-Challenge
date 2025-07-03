# use this to get the session id:
# curl -F 'file=@/Users/foohm/Downloads/State_ofQATrends-2025.pdf' http://localhost:8000/api/upload_pdf

curl -X POST http://localhost:8000/api/chat_with_pdf \
  -H "Content-Type: application/json" \
  -d '{"session_id": "1a5349c1-0ea8-46fb-820d-31d54f343b00", "question": "What is this PDF about?", "api_key": "<openai key"}'
