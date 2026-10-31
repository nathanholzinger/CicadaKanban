// Database-free position vocabulary shared by domain types and HTTP schemas.
// Position calculation and scope classification remain in their domain helpers.

export const sides = ['before', 'after'] as const;
export type Side = (typeof sides)[number];

export const positionScopes = ['attached-siblings', 'workflow', 'none'] as const;
export type PositionScope = (typeof positionScopes)[number];
