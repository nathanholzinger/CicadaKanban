// Generation and offline schema checks shared by all candidates. These helpers do not import
// the application or database and can generate artifacts without starting a server.

import openapiTS, { astToString } from 'openapi-typescript';
import Ajv2020 from 'ajv/dist/2020.js';
import type { Document } from './model.js';

export async function generateTypes(document: Document): Promise<string> {
  return astToString(await openapiTS(JSON.stringify(document), { silent: true }));
}

export function documentValidator(document: Document, name: string) {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  return ajv.compile({
    ...document.components.schemas[name],
    components: document.components,
  });
}
