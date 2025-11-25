'use client';

import { useEffect, useState } from 'react';

interface AccountResponse {
  account: {
    email: string;
  } | null;
}

export default function Home() {
  const [account, setAccount] = useState<AccountResponse['account']>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/account')
      .then((res) => res.json())
      .then((data: AccountResponse) => setAccount(data.account))
      .catch(() => setAccount(null));
  }, []);

  const connect = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/url');
      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      setError('Failed to start authentication');
      setLoading(false);
    }
  };

  return (
    <main className="hero">
      <div className="hero__card">
        <h1>MailPilot</h1>
        <p>
          An autonomous email co-pilot that triages your inbox, drafts context-aware replies, and automatically handles routine
          conversations so you can focus on deep work.
        </p>
        {error && <p className="hero__error">{error}</p>}
        <div className="hero__actions">
          <button onClick={connect} disabled={loading}>
            {account ? `Reconnect ${account.email}` : 'Connect Gmail'}
          </button>
          {account && (
            <a href="/dashboard">Continue to dashboard</a>
          )}
        </div>
      </div>
    </main>
  );
}
