import Groq from 'groq-sdk';
import { env } from './env';

export const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export const GROQ_MODEL = 'llama-3.3-70b-versatile';
