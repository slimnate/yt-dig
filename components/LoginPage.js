import Link from "next/link";

export default function LoginPage({  }) {
    return (
    <>
        <h1>Sign in with a YouTube account to use the app</h1>
        <Link href='/api/auth/signin'><btn>Log in</btn></Link>
    </>
    )
}