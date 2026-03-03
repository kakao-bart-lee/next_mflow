import { SignupClient } from "./signup-client"

const SKIP_AUTH = process.env.SKIP_AUTH === "true"

export default function SignupPage() {
  return <SignupClient skipAuth={SKIP_AUTH} />
}
