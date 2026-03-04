import { LoginClient } from "./login-client"

const SKIP_AUTH = process.env.SKIP_AUTH === "true"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl = "" } = await searchParams

  const enabledProviders = {
    google: Boolean(process.env.GOOGLE_CLIENT_ID),
    twitter: Boolean(process.env.TWITTER_CLIENT_ID),
    kakao: Boolean(process.env.KAKAO_CLIENT_ID),
  }

  return <LoginClient skipAuth={SKIP_AUTH} callbackUrl={callbackUrl} enabledProviders={enabledProviders} />
}
