export type TenantRequest = { tenantId?: string } & Record<string, unknown>;

export function tenantMiddleware(
  req: TenantRequest,
  _res: unknown,
  next: (err?: unknown) => void,
) {
  // 临时方案：先写死 tenantId。
  // 未来可由鉴权中间件/guard 在每次请求中注入。
  const env = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } })
    .process?.env;
  req.tenantId = env?.TENANT_ID ?? 't1';
  next();
}
