import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAccountOrThrow, getThreadById, buildReplyMessage, sendReply } from '@/lib/google';
import { shouldAutoReply, buildAutoReply } from '@/lib/automation';
import { extractAddress } from '@/utils/email';
import { incrementAutoReplyCount } from '@/lib/store';

export const dynamic = 'force-dynamic';

const schema = z.object({
  threadId: z.string().min(1)
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 422 });
  }

  const account = await getAccountOrThrow();
  if (!account.autoReply.enabled) {
    return NextResponse.json({ error: 'Auto reply disabled' }, { status: 403 });
  }

  if (account.autoReply.sentToday >= account.autoReply.maxPerDay) {
    return NextResponse.json({ error: 'Daily auto-reply limit reached' }, { status: 429 });
  }

  const email = await getThreadById(parsed.data.threadId);
  if (!email) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  }

  const approve = await shouldAutoReply(email);
  if (!approve) {
    return NextResponse.json({ error: 'Requires manual review' }, { status: 412 });
  }

  const body = await buildAutoReply(email);
  const raw = await buildReplyMessage({
    threadId: email.id,
    messageId: email.messageId,
    subject: `Re: ${email.subject}`,
    to: extractAddress(email.from),
    from: account.email,
    body
  });

  await sendReply(account, email.id, raw);
  await incrementAutoReplyCount();
  return NextResponse.json({ ok: true, body });
}
