import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-change');
const issuer = 'ms-setter';
const audience = 'ms-users';

export type SessionPayload = {
  uid: number;
  username: string;
};

export async function signSession(payload: SessionPayload) {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, secret, { issuer, audience });
  return payload as unknown as SessionPayload;
}
