import { NextResponse } from 'next/server';
import { getAccount, updateAutoReply, clearState } from '@/lib/store';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const autoReplySchema = z.object({
  enabled: z.boolean().optional(),
  label: z.string().min(1).optional(),
  maxPerDay: z.number().int().positive().optional()
});

export async function GET() {
  const account = await getAccount();
  if (!account) return NextResponse.json({ account: null });
  return NextResponse.json({
    account: {
      id: account.id,
      email: account.email,
      autoReply: account.autoReply
    }
  });
}

export async function PATCH(request: Request) {
  const json = await request.json();
  const parsed = autoReplySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 422 });
  }
  await updateAutoReply(parsed.data);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearState();
  return NextResponse.json({ ok: true });
}
