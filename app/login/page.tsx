import { LoginClient } from "./login-client"

const SKIP_AUTH = process.env.SKIP_AUTH === "true"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl = "" } = await searchParams

  return <LoginClient skipAuth={SKIP_AUTH} callbackUrl={callbackUrl} />
}
