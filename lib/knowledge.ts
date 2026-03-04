const snippets = [
  'CHAIN maps to repository findById in infrastructure and orchestration in application use cases.',
  'READ loops typically map to paginated query endpoints in REST controllers.',
  'PF (Physical File) maps to JPA @Entity + table mapping in infrastructure.',
  'LF (Logical File) maps to indexes, tailored query methods, or specifications.',
  'DSPF interactions map to REST endpoints and response DTO contracts.',
  'WRITE maps to create commands with validation and transactional boundaries.',
  'UPDATE maps to idempotent update commands with optimistic locking considerations.',
  'DELETE maps to delete commands with integrity checks and audit hints.',
  'SRVPGM maps to domain/application services with clear interfaces.',
  'COPY members map to shared DTOs, constants, and validator helpers.'
];

export const retrieveSnippets = (query: string): string[] => {
  const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
  const scored = snippets.map((snippet) => {
    const score = terms.reduce((acc, term) => (snippet.toLowerCase().includes(term) ? acc + 1 : acc), 0);
    return { snippet, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .slice(0, 4)
    .map((item) => item.snippet);
};

export const allSnippets = snippets;
