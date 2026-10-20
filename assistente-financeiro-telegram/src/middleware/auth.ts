// Middleware preparado para Fase 2 (autenticação/validações adicionais)
// Pode ser expandido para rate limiting, logging estruturado, etc.
export function withAuth(handler: any) {
  return async (req: any, res: any) => {
    return handler(req, res);
  };
}