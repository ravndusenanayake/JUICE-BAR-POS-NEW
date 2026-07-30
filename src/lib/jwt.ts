import { SignJWT, jwtVerify } from "jose"

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET || "SUPER_SECRET_JUICE_BAR_KEY_2026_VERY_SECURE"
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: any) {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(getJwtSecretKey())
    return token
  } catch (error) {
    console.error("JWT Sign Error", error)
    return null
  }
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey())
    return payload
  } catch (error) {
    // console.error("JWT Verify Error", error)
    return null
  }
}
