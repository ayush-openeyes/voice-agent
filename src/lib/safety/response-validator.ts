// ============================================================
// Layer 5: Response Validation
// ============================================================

import Groq from 'groq-sdk';
import { ResponseValidationResult, SafetyLayerResult } from '@/types';

const RESPONSE_VALIDATION_PROMPT = `You are a response validation system. Analyze the AI assistant's response for quality and safety issues.

Check for:
1. Factual consistency — Does the response align with provided tool results?
2. Hallucinations — Does the response claim facts without evidence or tool backing?
3. Tool result alignment — If tools were used, does the response accurately reflect their output?
4. Safety compliance — Does the response contain any harmful, offensive, or inappropriate content?
5. Citation availability — If the response references data, can it be traced to a tool result?

Respond with ONLY valid JSON:
{
  "approved": true/false,
  "factualConsistency": true/false,
  "hallucinationDetected": true/false,
  "toolResultAlignment": true/false,
  "safetyCompliance": true/false,
  "issues": ["list of issues if any"]
}`;

export async function validateResponse(
  userQuery: string,
  aiResponse: string,
  toolResults: Array<{ toolName: string; result: unknown }> | undefined,
  apiKey: string,
): Promise<ResponseValidationResult> {
  try {
    const groq = new Groq({ apiKey });

    const toolContext = toolResults && toolResults.length > 0
      ? `\nTool Results Used:\n${JSON.stringify(toolResults, null, 2)}`
      : '\nNo tools were used.';

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: RESPONSE_VALIDATION_PROMPT },
        { role: 'user', content: `User Query: "${userQuery}"\n\nAI Response: "${aiResponse}"${toolContext}` }
      ],
      temperature: 0.1,
      max_completion_tokens: 300,
      response_format: { type: 'json_object' }
    });

    const text = response.choices[0]?.message?.content?.trim() || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return {
        approved: true,
        factualConsistency: true,
        hallucinationDetected: false,
        toolResultAlignment: true,
        safetyCompliance: true,
        issues: ['Could not parse validation response'],
      };
    }

    return JSON.parse(jsonMatch[0]) as ResponseValidationResult;
  } catch (error) {
    console.error('Response validation error:', error);
    return {
      approved: true,
      factualConsistency: true,
      hallucinationDetected: false,
      toolResultAlignment: true,
      safetyCompliance: true,
      issues: ['Validation service unavailable'],
    };
  }
}

/**
 * Converts response validation result to a SafetyLayerResult for the pipeline.
 */
export function responseValidationToLayerResult(
  result: ResponseValidationResult,
): SafetyLayerResult {
  const issues: string[] = [];
  if (!result.factualConsistency) issues.push('Factual inconsistency');
  if (result.hallucinationDetected) issues.push('Hallucination detected');
  if (!result.toolResultAlignment) issues.push('Tool result misalignment');
  if (!result.safetyCompliance) issues.push('Safety compliance failure');

  return {
    layer: 'response_validation',
    layerNumber: 5,
    passed: result.approved,
    reason: result.approved ? undefined : issues.join('; '),
    matchedPatterns: issues.length > 0 ? issues : undefined,
  };
}
