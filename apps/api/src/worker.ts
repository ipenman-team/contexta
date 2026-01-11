import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

type WorkerEnv = Record<string, string | undefined>;

let appPromise: Promise<NestFastifyApplication> | undefined;

type InjectOptions = {
  method: string;
  url: string;
  headers: Record<string, string>;
  payload?: Uint8Array;
};

type InjectResult = {
  statusCode: number;
  headers?: Record<string, string | string[] | undefined>;
  payload: string;
};

type InjectableServer = {
  inject(options: InjectOptions): Promise<InjectResult>;
};

function mergeEnv(env: WorkerEnv) {
  const g = globalThis as unknown as {
    process?: {
      env?: Record<string, string | undefined>;
      cwd?: () => string;
    };
  };

  g.process ??= {};
  g.process.cwd ??= () => '/';
  g.process.env = { ...(g.process.env ?? {}), ...env };
  g.process.env.CF_WORKER = g.process.env.CF_WORKER ?? 'true';
  g.process.env.PRISMA_CLIENT = g.process.env.PRISMA_CLIENT ?? 'edge';
}

async function getApp(env: WorkerEnv): Promise<NestFastifyApplication> {
  mergeEnv(env);
  if (appPromise) return appPromise;

  appPromise = (async () => {
    const adapter = new FastifyAdapter();
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter);
    app.enableCors();
    await app.init();
    return app;
  })();

  return appPromise;
}

export default {
  async fetch(request: Request, env: WorkerEnv, _ctx: { waitUntil(promise: Promise<unknown>): void }) {
    void _ctx;
    const app = await getApp(env);
    const server = app.getHttpAdapter().getInstance() as unknown as InjectableServer;

    const url = new URL(request.url);
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const body =
      request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();

    const res = await server.inject({
      method: request.method,
      url: `${url.pathname}${url.search}`,
      headers,
      payload: body ? new Uint8Array(body) : undefined,
    });

    const responseHeaders = new Headers();
    for (const [key, value] of Object.entries(res.headers ?? {})) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        if (key.toLowerCase() === 'set-cookie') {
          for (const v of value) responseHeaders.append(key, String(v));
        } else {
          responseHeaders.set(key, value.map((v) => String(v)).join(','));
        }
      } else {
        responseHeaders.set(key, String(value));
      }
    }

    return new Response(res.payload, {
      status: res.statusCode,
      headers: responseHeaders,
    });
  },
};
