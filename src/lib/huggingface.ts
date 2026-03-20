import { HfInference } from '@huggingface/inference';

export const hf = new HfInference(process.env.HF_TOKEN);

export const MODEL = process.env.NEXT_PUBLIC_HF_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';
