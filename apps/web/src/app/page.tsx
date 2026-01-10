"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

  async function callPing() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/ping`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as unknown;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className={styles.intro}>
          <h1>To get started, edit the page.tsx file.</h1>
          <p>
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className={styles.secondary}
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>

        <div className={styles.intro}>
          <h2>FE ↔ BE 连通性测试</h2>
          <p>点击按钮请求 Nest API：{apiBaseUrl}/ping</p>
          <button className={styles.primary} onClick={callPing} disabled={loading}>
            {loading ? "请求中..." : "调用 /ping"}
          </button>

          {error ? (
            <p>错误：{error}</p>
          ) : result ? (
            <pre>{JSON.stringify(result, null, 2)}</pre>
          ) : null}
        </div>
      </main>
    </div>
  );
}
