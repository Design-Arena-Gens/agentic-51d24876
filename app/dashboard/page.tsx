'use client';

import { useEffect, useMemo, useState } from 'react';

interface Account {
  id: string;
  email: string;
  autoReply: {
    enabled: boolean;
    label: string;
    maxPerDay: number;
    sentToday: number;
  };
}

interface EmailThread {
  id: string;
  messageId?: string;
  subject: string;
  snippet: string;
  from: string;
  date: string;
  bodyPlain?: string;
}

interface DraftProposal {
  threadId: string;
  subject: string;
  body: string;
}

export default function Dashboard() {
  const [account, setAccount] = useState<Account | null>(null);
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [draft, setDraft] = useState<DraftProposal | null>(null);
  const [context, setContext] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [sending, setSending] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);

  useEffect(() => {
    Promise.all([fetch('/api/account'), fetch('/api/emails')])
      .then(async ([accRes, emailRes]) => {
        const acc = await accRes.json();
        const emailJson = await emailRes.json();
        setAccount(acc.account);
        setThreads(emailJson.threads);
        setSelectedThread(emailJson.threads?.[0] ?? null);
      })
      .catch(() => setStatus('Failed to load data. Refresh.'));
  }, []);

  const loadAccount = async () => {
    try {
      const res = await fetch('/api/account');
      const data = await res.json();
      setAccount(data.account);
    } catch (err) {
      setStatus('Unable to refresh account state');
    }
  };

  const refreshInbox = async () => {
    try {
      setLoadingThreads(true);
      const res = await fetch('/api/emails');
      const data = await res.json();
      setThreads(data.threads);
      setSelectedThread((prev) => data.threads.find((t: EmailThread) => t.id === prev?.id) ?? data.threads[0] ?? null);
    } catch (err) {
      setStatus('Unable to refresh inbox');
    } finally {
      setLoadingThreads(false);
    }
  };

  const triggerDraft = async () => {
    if (!selectedThread) return;
    try {
      setLoadingDraft(true);
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: selectedThread.id, context })
      });
      if (!res.ok) throw new Error('draft_failed');
      const data = await res.json();
      setDraft(data.draft);
      setStatus('Draft ready');
    } catch (err) {
      setStatus('Unable to generate draft');
    } finally {
      setLoadingDraft(false);
    }
  };

  const sendDraft = async () => {
    if (!draft || !selectedThread || !account) return;
    const payload = {
      threadId: draft.threadId,
      subject: draft.subject,
      body: draft.body,
      to: selectedThread.from
    };
    try {
      setSending(true);
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('send_failed');
      setStatus('Reply sent');
      await Promise.all([refreshInbox(), loadAccount()]);
      setDraft(null);
    } catch (err) {
      setStatus('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleAutoReply = async () => {
    if (!selectedThread) return;
    try {
      setAutoRunning(true);
      const res = await fetch('/api/auto-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: selectedThread.id })
      });
      if (!res.ok) {
        const err = await res.json();
        setStatus(err.error ?? 'Auto reply blocked');
        return;
      }
      const payload = await res.json();
      setStatus(`Auto reply sent: ${payload.body.slice(0, 60)}...`);
      await Promise.all([refreshInbox(), loadAccount()]);
    } catch (err) {
      setStatus('Auto reply failed');
    } finally {
      setAutoRunning(false);
    }
  };

  const metadata = useMemo(() => {
    if (!selectedThread) return null;
    const fromMatch = selectedThread.from.split('<');
    return {
      sender: fromMatch[0].trim(),
      address: selectedThread.from,
      received: new Date(selectedThread.date).toLocaleString()
    };
  }, [selectedThread]);

  return (
    <div className="dash">
      <header className="dash__topbar">
        <div>
          <h2>MailPilot Control Tower</h2>
          {account && <p className="dash__identity">Connected as {account.email}</p>}
        </div>
        <div className="dash__actions">
          <button onClick={refreshInbox} disabled={loadingThreads}>
            {loadingThreads ? 'Refreshing…' : 'Refresh inbox'}
          </button>
        </div>
      </header>

      <div className="dash__layout">
        <aside className="dash__aside">
          <h3>Inbox monitor</h3>
          <ul>
            {threads.map((thread) => (
              <li
                key={thread.id}
                className={thread.id === selectedThread?.id ? 'active' : ''}
                onClick={() => setSelectedThread(thread)}
              >
                <span className="subject">{thread.subject}</span>
                <span className="from">{thread.from}</span>
                <span className="snippet">{thread.snippet}</span>
              </li>
            ))}
            {threads.length === 0 && <li className="empty">Inbox clear for now.</li>}
          </ul>
        </aside>

        <section className="dash__main">
          {selectedThread ? (
            <div className="thread">
              <header>
                <h3>{selectedThread.subject}</h3>
                {metadata && (
                  <p>
                    {metadata.address} • {metadata.received}
                  </p>
                )}
              </header>
              <article>{selectedThread.bodyPlain ?? selectedThread.snippet}</article>
            </div>
          ) : (
            <div className="empty-state">Select an email to begin.</div>
          )}

          <div className="composer">
            <textarea
              placeholder="Add context or constraints for the AI (optional)"
              value={context}
              onChange={(event) => setContext(event.target.value)}
            />
            <div className="composer__toolbar">
              <button onClick={triggerDraft} disabled={!selectedThread || loadingDraft}>
                {loadingDraft ? 'Drafting…' : 'Draft reply'}
              </button>
              <button onClick={sendDraft} disabled={!draft || sending}>
                {sending ? 'Sending…' : 'Send draft'}
              </button>
              <button onClick={handleAutoReply} disabled={!selectedThread || autoRunning}>
                {autoRunning ? 'Evaluating…' : 'Auto reply'}
              </button>
            </div>
            <textarea
              className="composer__draft"
              placeholder="Draft output will appear here"
              value={draft?.body ?? ''}
              onChange={(event) =>
                setDraft((prev) =>
                  prev ? { ...prev, body: event.target.value } : prev
                )
              }
            />
          </div>
        </section>

        <aside className="dash__sidebar">
          <h3>Automation guardrails</h3>
          {account ? (
            <div className="sidebar__card">
              <p>
                Auto replies are <strong>{account.autoReply.enabled ? 'enabled' : 'disabled'}</strong>
              </p>
              <p>
                Daily limit: {account.autoReply.sentToday}/{account.autoReply.maxPerDay}
              </p>
              <p>Label monitored: {account.autoReply.label}</p>
            </div>
          ) : (
            <p>Account loading…</p>
          )}
          {status && <p className="status">{status}</p>}
        </aside>
      </div>
    </div>
  );
}
