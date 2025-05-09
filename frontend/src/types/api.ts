export interface ChatRequest {
  developer_message: string;
  user_message: string;
  model?: string;
  api_key: string;
}

export interface ChatResponse {
  content: string;
} 