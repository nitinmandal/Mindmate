import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hf, MODEL } from '@/lib/huggingface';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { message, chatHistory, stressLevel } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.HF_TOKEN;

    if (!apiKey) {
      // Fallback response if API key is not configured
      const fallbackResponses = [
        "I'm here to listen. Tell me more about what's on your mind.",
        "That sounds challenging. How are you coping with this situation?",
        "Thank you for sharing that with me. Your feelings are completely valid.",
        "It's okay to feel this way. Would you like to talk about what's causing these feelings?",
        "I appreciate you opening up. Remember, taking care of your mental health is important.",
        "That must be difficult for you. Have you tried any techniques to help manage these feelings?",
        "I hear you. Remember that it's okay to ask for help when you need it.",
        "Your wellbeing matters. Is there anything specific that's been troubling you lately?",
      ];

      const response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

      return NextResponse.json({
        response,
        fallback: true,
      });
    }

    // Build system prompt based on stress level
    let systemPrompt = `You are Lyra, a warm, empathetic, non-judgmental AI companion for student mental wellness.

Always respond softly, kindly, and without clinical language.
Validate emotions, encourage healthy coping strategies, and offer gentle guidance.
Never diagnose, give medication advice, or encourage harmful actions.
If a user shows high distress, suggest reaching out to a trusted adult or a mental health professional.

Your goal is to help students feel calm, understood, and emotionally supported.

Keep responses brief but meaningful (2-4 sentences). Be conversational and caring.`;

    if (stressLevel === 'high') {
      systemPrompt += '\n\nNote: This student is experiencing high stress levels. Be extra gentle, validating, and supportive. Gently suggest they consider talking to a trusted adult, school counselor, or mental health professional.';
    } else if (stressLevel === 'moderate') {
      systemPrompt += '\n\nNote: This student has moderate stress levels. Provide practical, gentle coping strategies and encouragement.';
    }

    // Prepare messages for Hugging Face
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(chatHistory || []).slice(-6).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })),
      { role: 'user' as const, content: message },
    ];

    try {
      // Use Hugging Face Chat Completion API
      const stream = hf.chatCompletionStream({
        model: MODEL,
        messages: messages,
        max_tokens: 300,
        temperature: 0.8,
      });

      let aiResponse = '';
      
      for await (const chunk of stream) {
        if (chunk.choices && chunk.choices.length > 0) {
          const delta = chunk.choices[0].delta;
          if (delta.content) {
            aiResponse += delta.content;
          }
        }
      }

      const finalResponse = aiResponse.trim() || "I'm here to listen. Can you tell me more?";

      return NextResponse.json({
        response: finalResponse,
        fallback: false,
      });
    } catch (hfError: any) {
      console.error('Hugging Face API error:', hfError);
      
      // Fallback to a compassionate response
      const fallbackResponses = [
        "I'm here to listen and support you. Could you tell me more about how you're feeling?",
        "Thank you for sharing with me. I want to understand better - can you elaborate on that?",
        "I hear you, and your feelings are valid. What's been on your mind lately?",
        "It sounds like you're going through something difficult. I'm here for you. Tell me more?",
      ];

      return NextResponse.json({
        response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        fallback: true,
      });
    }
  } catch (error) {
    console.error('Chat AI error:', error);
    
    // Return a compassionate fallback response on error
    return NextResponse.json({
      response: "I'm having trouble processing that right now, but I'm here for you. Could you try rephrasing or tell me more about how you're feeling?",
      fallback: true,
    }, { status: 200 });
  }
}