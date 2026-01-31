import { GoogleGenAI, Type } from "@google/genai";
import { Decision, DecisionAnalysis, Emotion, OutcomeAnalysis } from "../../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-3-pro-preview for complex reasoning tasks
const MODEL_NAME = 'gemini-2.5-flash'
// 'gemini-3-pro-preview';

export const analyzeDecision = async (
  title: string,
  description: string,
  context: string,
  emotions: Emotion[],
  options: string[]
): Promise<DecisionAnalysis> => {
  const prompt = `
    You are an expert cognitive scientist and decision coach. Your goal is to help a user introspect on a specific decision they are facing or have made.
    
    Decision Title: ${title}
    Description: ${description}
    Context/Background: ${context}
    Current Emotional State: ${emotions.join(', ')}
    Options Considered: ${options.join(', ')}

    Please perform a deep introspection analysis:
    1. Identify potential cognitive biases influencing this decision (e.g., Sunk Cost, Confirmation Bias, Anchoring).
    2. Point out "blind spots" - things the user might be missing or underestimating.
    3. Suggest alternative perspectives or "What if" scenarios that challenge the current thinking.
    4. Provide a "Clarity Score" (0-100) based on how well-reasoned the input seems.
    5. Simulate 2 potential outcomes for different paths.
    6. Generate 3-5 distinct semantic tags/keywords that categorize the nature of this decision (e.g. "Career", "Finance", "Interpersonal", "High Risk").

    Return the result in strictly valid JSON format matching the schema provided.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A brief executive summary of the decision landscape." },
            biases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  probability: { type: Type.NUMBER, description: "0 to 100 estimated likelihood" },
                  mitigation: { type: Type.STRING, description: "Advice on how to counter this bias" },
                },
                required: ["name", "description", "probability", "mitigation"]
              }
            },
            blindSpots: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            alternativePerspectives: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            simulations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  scenario: { type: Type.STRING, description: "The what-if path" },
                  outcome: { type: Type.STRING, description: "The predicted result" },
                  riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
                },
                required: ["scenario", "outcome", "riskLevel"]
              }
            },
            clarityScore: { type: Type.NUMBER },
            relatedTags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "biases", "blindSpots", "alternativePerspectives", "simulations", "clarityScore", "relatedTags"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as DecisionAnalysis;

  } catch (error) {
    console.error("Error analyzing decision:", error);
    throw error;
  }
};

export const analyzeOutcome = async (
  decision: Decision,
  actualOutcome: string
): Promise<OutcomeAnalysis> => {
  const prompt = `
    The user has now taken action on a decision you previously analyzed. 
    Analyze the causal relationship between their original thought process and the actual outcome.

    ORIGINAL DECISION:
    Title: ${decision.title}
    Description: ${decision.description}
    Predicted Biases: ${decision.analysis?.biases.map(b => b.name).join(', ')}
    Original Clarity Score: ${decision.analysis?.clarityScore}

    ACTUAL OUTCOME:
    "${actualOutcome}"

    TASK:
    1. Causal Reflection: Connect the dots. Did the predicted biases manifest? Was the outcome surprising?
    2. Bias Validation: Specifically confirm if the initial biases were accurate predictors.
    3. Learning Point: What is the single most important lesson for future decisions?
    4. Updated Clarity Score: Re-evaluate the initial decision quality in hindsight.

    Return JSON matching schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            causalReflection: { type: Type.STRING },
            biasValidation: { type: Type.STRING },
            learningPoint: { type: Type.STRING },
            updatedClarityScore: { type: Type.NUMBER }
          },
          required: ["causalReflection", "biasValidation", "learningPoint", "updatedClarityScore"]
        }
      }
    });
     
    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as OutcomeAnalysis;

  } catch (error) {
    console.error("Error analyzing outcome", error);
    throw error;
  }
};

export const generatePatterns = async (decisions: Decision[]): Promise<{
  insight: string;
  dominantBias: string;
  recommendation: string;
}> => {
  if (decisions.length === 0) {
    return {
      insight: "Not enough data to generate patterns.",
      dominantBias: "None",
      recommendation: "Start logging decisions to see patterns."
    };
  }

  // Handle potential legacy data where emotion might be string, though types say array now
  const getEmotionsString = (d: Decision) => {
      if (Array.isArray(d.emotions)) return d.emotions.join(', ');
      // @ts-ignore - backward compatibility
      return d.emotion || 'Neutral'; 
  }

  // Simplified summary of decisions for the context
  const history = decisions.map(d => 
    `Title: ${d.title}, Emotions: ${getEmotionsString(d)}, Status: ${d.status}, Bias Found: ${d.analysis?.biases[0]?.name || 'None'}`
  ).join('\n');

  const prompt = `
    Analyze this user's decision history to find behavioral patterns.
    History:
    ${history}

    Return a JSON with:
    - insight: A deep psychological insight about their decision making style.
    - dominantBias: The most frequent cognitive trap they fall into.
    - recommendation: One actionable habit to improve.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight: { type: Type.STRING },
            dominantBias: { type: Type.STRING },
            recommendation: { type: Type.STRING },
          },
          required: ["insight", "dominantBias", "recommendation"]
        }
      }
    });
    
    const text = response.text;
    if (!text) return { insight: "Error", dominantBias: "Error", recommendation: "Error" };
    return JSON.parse(text);

  } catch (error) {
    console.error("Error detecting patterns", error);
    return {
       insight: "Could not analyze patterns at this time.",
       dominantBias: "Unknown",
       recommendation: "Continue logging to build a dataset."
    };
  }
}

export const createSimulationChat = (decision: Decision, scenario?: string) => {
  const systemInstruction = `
    You are an advanced Decision Simulation Engine called CogniClear using the Gemini 3 Pro model.
    
    USER DECISION CONTEXT:
    Title: "${decision.title}"
    Description: "${decision.description}"
    Context: "${decision.context}"
    Current Emotion: "${decision.emotions.join(', ')}"
    Options Considered: "${decision.optionsConsidered.join(', ')}"
    
    ${scenario ? `FOCUS SCENARIO: The user wants to simulate the specific path: "${scenario}".` : 'The user wants to explore potential outcomes generically.'}
    
    YOUR ROLE:
    1. Act as a "Future Simulator". You are not just an assistant, you are the environment/context of the future resulting from this decision.
    2. Immerse the user in the consequences of their choice. Describe the sights, sounds, and feelings in the second person ("You are...").
    3. If the scenario involves conflict, roleplay the counter-party realistically.
    4. If the scenario is internal, roleplay the internal monologue of their future self.
    5. Be realistic. Do not sugarcoat high risks or ignore benefits.
    6. Keep responses conversational (under 120 words usually) but impactful.
    7. Always end with a question or a new development that forces the user to make a choice or reflect within the simulation.
  `;

  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: systemInstruction,
    }
  });
};
