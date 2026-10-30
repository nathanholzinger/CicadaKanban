import { createLibraryCandidate } from './zod-library/index.js';
import { createNativeCandidate } from './zod-native/index.js';
import { createTypeboxCandidate } from './typebox-ajv/index.js';

export const candidateFactories = [createLibraryCandidate, createNativeCandidate, createTypeboxCandidate];
