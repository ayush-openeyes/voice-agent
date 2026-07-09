import type { ChatCompletionTool } from 'groq-sdk/resources/chat/completions';

// ============================================================
// Groq Tools (OpenAI Format)
// ============================================================

export const GROQ_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'getWeather',
      description: 'Get the current weather for a specific location.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and state/country, e.g., "San Francisco, CA"',
          },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getCurrentTime',
      description: 'Get the current time in a specific timezone.',
      parameters: {
        type: 'object',
        properties: {
          timezone: {
            type: 'string',
            description: 'The IANA timezone string, e.g., "America/Los_Angeles" or "UTC"',
          },
        },
        required: ['timezone'],
      },
    },
  },
];

// ---- Tool Execution Logic ----

export async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'getWeather':
      return getWeather(args.location as string);
    case 'getCurrentTime':
      return getCurrentTime(args.timezone as string);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Mock implementation for Weather
async function getWeather(location: string) {
  await new Promise((r) => setTimeout(r, 400)); // simulate network latency
  
  // Deterministic mock based on location string
  const locLower = location.toLowerCase();
  if (locLower.includes('new york')) {
    return { temperature: 72, conditions: 'Sunny', humidity: 45, location: 'New York, NY' };
  }
  if (locLower.includes('london')) {
    return { temperature: 60, conditions: 'Rainy', humidity: 80, location: 'London, UK' };
  }
  
  // Default fallback
  return { temperature: 68, conditions: 'Partly Cloudy', humidity: 50, location };
}

// Actual implementation for Time
async function getCurrentTime(timezone: string) {
  try {
    const time = new Date().toLocaleString('en-US', { timeZone: timezone });
    return { time, timezone };
  } catch (e) {
    return { error: `Invalid timezone: ${timezone}. Use IANA format like America/New_York` };
  }
}
