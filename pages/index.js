import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { useSession } from 'next-auth/react';
import Dashboard from '../components/Dashboard';
import LoginPage from '../components/LoginPage';

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className={styles.container}>
      <Head>
        <title>yt-dig</title>
        <meta name="description" content="Find out what YouTuber's you're subscribed to fell off" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        {status === 'authenticated' && <Dashboard session={session}/> }
        {status !== 'authenticated' && <LoginPage /> }
      </main>
    </div>
  )
}
