// Generates client declarations and compiles independent JSON Schema checks. This module
// has no application/database imports and never enables input-mutating Ajv options.

import openapiTS, { astToString } from 'openapi-typescript';
import Ajv2020 from 'ajv/dist/2020.js';
export { Ajv2020 };

export type ContractDocument = {
  openapi: string;
  info: { title: string; version: string; description: string };
  paths: Record<string, unknown>;
  components: { schemas: Record<string, Record<string, unknown>> };
};

export async function generateTypes(document: ContractDocument): Promise<string> {
  return astToString(await openapiTS(JSON.stringify(document), { silent: true }));
}

export function documentValidator(document: ContractDocument, name: string) {
  const ajv = new Ajv2020({
    strict: false,
    allErrors: true,
    useDefaults: false,
    coerceTypes: false,
    removeAdditional: false,
  });
  return ajv.compile({ ...document.components.schemas[name], components: document.components });
}
