/**
 * Parse a raw JSONL string into an array of parsed objects.
 *
 * Each element is either:
 *   { ok: true,  obj: <parsed JSON>, lineNo }
 *   { ok: false, lineNo, raw, error }
 */
export function parseJsonl(text) {
  const lines = text.split('\n');
  const objs = [];

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) return;
    try {
      objs.push({ ok: true, obj: JSON.parse(line), lineNo: idx + 1 });
    } catch (e) {
      objs.push({ ok: false, lineNo: idx + 1, raw: line, error: e.message });
    }
  });

  return objs;
}

/** Sample data pre-loaded in the viewer for demonstration. */
export const SAMPLE = `{"type":"message","id":"a1b2c3d4","parentId":"root","timestamp":"2026-07-07T10:15:00.000Z","message":{"role":"user","content":[{"type":"text","text":"I need to refactor the authentication module in @myapp/services/auth/ — it's getting unwieldy."}],"timestamp":1751883300000}}
{"type":"message","id":"e5f6g7h8","parentId":"a1b2c3d4","timestamp":"2026-07-07T10:15:04.500Z","message":{"role":"assistant","content":[{"type":"thinking","thinking":"The user wants to refactor an auth module. Let me explore the directory structure first to understand the scope of the work and identify which files need attention.","thinkingSignature":"reasoning_content"},{"type":"text","text":"Let me take a look at the auth module structure before we dive in."},{"type":"toolCall","id":"call_00_ABC123","name":"bash","arguments":{"command":"find ~/projects/myapp/src/services/auth -type f | head -40"}},{"type":"toolCall","id":"call_01_DEF456","name":"bash","arguments":{"command":"wc -l ~/projects/myapp/src/services/auth/*.ts"}}],"api":"openai-completions","provider":"anthropic","model":"claude-sonnet-4-20250514","usage":{"input":2847,"output":156,"cacheRead":2800,"cacheWrite":0,"totalTokens":5803,"cost":{"input":0.008541,"output":0.001248,"cacheRead":0.0014,"cacheWrite":0,"total":0.011189}},"stopReason":"toolUse","timestamp":1751883304500,"responseId":"msg_01abc123def456"}}
{"type":"message","id":"i9j0k1l2","parentId":"e5f6g7h8","timestamp":"2026-07-07T10:15:04.510Z","message":{"role":"toolResult","toolCallId":"call_00_ABC123","toolName":"bash","content":[{"type":"text","text":"~/projects/myapp/src/services/auth/AuthService.ts\\n~/projects/myapp/src/services/auth/TokenManager.ts\\n~/projects/myapp/src/services/auth/OAuthProvider.ts\\n~/projects/myapp/src/services/auth/SessionStore.ts\\n~/projects/myapp/src/services/auth/index.ts\\n~/projects/myapp/src/services/auth/__tests__/AuthService.test.ts\\n"}],"isError":false,"timestamp":1751883304510}}
{"type":"message","id":"m3n4o5p6","parentId":"i9j0k1l2","timestamp":"2026-07-07T10:15:04.515Z","message":{"role":"toolResult","toolCallId":"call_01_DEF456","toolName":"bash","content":[{"type":"text","text":"  412 ~/projects/myapp/src/services/auth/AuthService.ts\\n  198 ~/projects/myapp/src/services/auth/TokenManager.ts\\n   87 ~/projects/myapp/src/services/auth/OAuthProvider.ts\\n   64 ~/projects/myapp/src/services/auth/SessionStore.ts\\n   12 ~/projects/myapp/src/services/auth/index.ts\\n  773 total"}],"isError":false,"timestamp":1751883304515}}
{"type":"message","id":"q7r8s9t0","parentId":"m3n4o5p6","timestamp":"2026-07-07T10:15:08.200Z","message":{"role":"assistant","content":[{"type":"thinking","thinking":"AuthService.ts is 412 lines — that's the main target for refactoring. Let me read the key files to understand the current architecture before suggesting a plan.","thinkingSignature":"reasoning_content"},{"type":"text","text":"AuthService.ts is the heavy one at 412 lines. Let me read the main files and then we can plan the refactor."},{"type":"toolCall","id":"call_02_GHI789","name":"read","arguments":{"path":"~/projects/myapp/src/services/auth/AuthService.ts"}}],"api":"openai-completions","provider":"anthropic","model":"claude-sonnet-4-20250514","usage":{"input":1634,"output":218,"cacheRead":6200,"cacheWrite":0,"totalTokens":8052,"cost":{"input":0.004902,"output":0.001744,"cacheRead":0.0031,"cacheWrite":0,"total":0.009746}},"stopReason":"toolUse","timestamp":1751883308200,"responseId":"msg_02ghi789jkl012"}}
{"type":"message","id":"u1v2w3x4","parentId":"q7r8s9t0","timestamp":"2026-07-07T10:15:08.210Z","message":{"role":"toolResult","toolCallId":"call_02_GHI789","toolName":"read","content":[{"type":"text","text":"// AuthService.ts — handles login, MFA, session refresh, and role resolution\\n// TODO: split into smaller modules — this class has too many responsibilities\\nimport { TokenManager } from './TokenManager';\\nimport { OAuthProvider } from './OAuthProvider';\\nimport { SessionStore } from './SessionStore';\\n\\nexport class AuthService {\\n  constructor(\\n    private tokens: TokenManager,\\n    private oauth: OAuthProvider,\\n    private sessions: SessionStore\\n  ) {}\\n\\n  async login(credentials: Credentials): Promise<Session> { ... }\\n  async verifyMfa(code: string, sessionId: string): Promise<boolean> { ... }\\n  async refreshToken(session: Session): Promise<TokenPair> { ... }\\n  async resolveRoles(userId: string): Promise<Role[]> { ... }\\n  async logout(sessionId: string): Promise<void> { ... }\\n}"}],"isError":false,"timestamp":1751883308210}}`;
