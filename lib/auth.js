import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "session";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET || "fallback-secret-jangan-dipakai-production";
  return new TextEncoder().encode(secret);
}

// Membuat token JWT berisi data user yang sedang login.
export async function createSessionToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecretKey());
}

// Memverifikasi token, mengembalikan payload jika valid, null jika tidak.
export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch (err) {
    return null;
  }
}

// Dipakai di Server Component / Route Handler untuk membaca user yang login.
export async function getSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
