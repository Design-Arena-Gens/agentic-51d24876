export interface GmailToken {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  scope: string;
  tokenType: string;
}

export interface AccountState {
  id: string;
  email: string;
  tokens: GmailToken;
  autoReply: {
    enabled: boolean;
    label: string;
    maxPerDay: number;
    sentToday: number;
    lastReset: string;
  };
}

export interface EmailThread {
  id: string;
  messageId?: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
  bodyPlain?: string;
}

export interface DraftProposal {
  threadId: string;
  subject: string;
  body: string;
}
