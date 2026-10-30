// Sends a compatible 400 for schema failures and returns a typed successful parse. Exceptions
// deliberately left outside this helper retain the global error pipeline's behavior.

import type { Response } from 'express';
import * as z from 'zod';
import { schemaErrorMessage } from '../schemas/common.js';

export function parseRequest<S extends z.ZodType>(schema: S, input: unknown, res: Response): z.output<S> | undefined {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  res.status(400).json({ error: schemaErrorMessage(result.error) });
  return undefined;
}
