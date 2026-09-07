// Single source of truth for the E2E API base URL — was hardcoded
// (`const API`/`const BASE = 'http://localhost:3002/api'`) independently in
// ~19 files across tests/api/*, tests/ui/*, and tests/helpers/* (audit
// Finding #27). Must match playwright.config.ts's server webServer port.
export const API = 'http://localhost:3002/api';
