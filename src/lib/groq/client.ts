import Groq from 'groq-sdk';
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';
import { SYSTEM_PROMPT } from '../gemini/system-prompt'; // Re-use the same system prompt
import { GROQ_TOOLS, executeTool } from './tools';
import { validateToolResult, TOOL_VALIDATION_FAILURE_MESSAGE } from '../gemini/tool-validator'; // Re-use the same validator

// Re-use the same callbacks interface so the frontend route doesn't need to change
export interface GroqStreamCallbacks {
  onStateChange: (state: string, label: string) => void;
  onContent: (chunk: string, accumulated: string) => void;
  onToolCall: (toolName: string, args: Record<string, unknown>) => void;
  onToolResult: (toolName: string, result: unknown, validated: boolean, executionTimeMs: number) => void;
  onError: (message: string) => void;
}

export interface GroqStreamResult {
  fullResponse: string;
  toolsUsed: string[];
  latencyMs: number;
  model: string;
}

export async function streamGroqResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  apiKey: string,
  callbacks: GroqStreamCallbacks,
): Promise<GroqStreamResult> {
  const startTime = Date.now();
  const groq = new Groq({ apiKey });
  const toolsUsed: string[] = [];
  let fullResponse = '';
  const model = 'llama-3.3-70b-versatile';

  // Build the conversation history in OpenAI format
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    } as ChatCompletionMessageParam)),
    { role: 'user', content: userMessage },
  ];

  try {
    // Step 1: Intent Classification + Tool Selection
    callbacks.onStateChange('intent_classification', 'Classifying Intent');
    callbacks.onStateChange('reasoning', 'Thinking');

    // First API call
    let responseStream = await groq.chat.completions.create({
      model,
      messages,
      tools: GROQ_TOOLS,
      tool_choice: 'auto',
      stream: true,
      max_completion_tokens: 1024,
      temperature: 0.7,
    });

    let toolCallsBuffer: any[] = [];
    let currentToolCallIndex = -1;

    for await (const chunk of responseStream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      // Handle tool calls streaming
      if (delta.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          if (toolCall.index !== undefined) {
            currentToolCallIndex = toolCall.index;
            if (!toolCallsBuffer[currentToolCallIndex]) {
              toolCallsBuffer[currentToolCallIndex] = {
                id: toolCall.id,
                type: 'function',
                function: { name: toolCall.function?.name || '', arguments: '' },
              };
            }
          }
          if (toolCall.function?.arguments) {
            toolCallsBuffer[currentToolCallIndex].function.arguments += toolCall.function.arguments;
          }
        }
      }

      // Handle normal text streaming
      if (delta.content) {
        fullResponse += delta.content;
        callbacks.onContent(delta.content, fullResponse);
      }
    }

    // Step 2: Tool Execution (if any tools were called)
    if (toolCallsBuffer.length > 0) {
      // Append the assistant's tool call message to the history
      messages.push({
        role: 'assistant',
        tool_calls: toolCallsBuffer,
      });

      for (const toolCall of toolCallsBuffer) {
        const functionName = toolCall.function.name;
        let functionArgs = {};
        try {
          functionArgs = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          console.error('Failed to parse tool arguments:', toolCall.function.arguments);
        }

        callbacks.onToolCall(functionName, functionArgs);
        toolsUsed.push(functionName);

        const toolStartTime = Date.now();
        let rawResult: unknown;
        let executionError = false;

        try {
          rawResult = await executeTool(functionName, functionArgs);
        } catch (e) {
          rawResult = { error: e instanceof Error ? e.message : 'Unknown error' };
          executionError = true;
        }

        const executionTimeMs = Date.now() - toolStartTime;
        const toolExecutionResult = {
          success: !executionError,
          data: executionError ? undefined : rawResult,
          error: executionError ? (rawResult as any).error : undefined,
          executionTimeMs,
          timestamp: Date.now(),
        };

        // Validate the result
        const validation = validateToolResult(functionName, toolExecutionResult as any);
        const validated = validation.valid;
        const finalResult = validated ? toolExecutionResult : { error: TOOL_VALIDATION_FAILURE_MESSAGE, originalResult: toolExecutionResult };

        callbacks.onToolResult(functionName, finalResult, validated, executionTimeMs);

        // Append the tool result to the conversation
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(finalResult),
        });
      }

      // Step 3: Second API call with tool results
      callbacks.onStateChange('reasoning', 'Formulating Response');

      const followUpStream = await groq.chat.completions.create({
        model,
        messages,
        stream: true,
        max_completion_tokens: 1024,
        temperature: 0.7,
      });

      for await (const chunk of followUpStream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullResponse += delta.content;
          callbacks.onContent(delta.content, fullResponse);
        }
      }
    }

    return {
      fullResponse,
      toolsUsed,
      latencyMs: Date.now() - startTime,
      model,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown Groq error';
    callbacks.onError(msg);
    throw error;
  }
}
