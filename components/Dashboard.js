import Link from "next/link";
import { useEffect, useState } from "react";
import Subscriptions from "./Subscriptions";

export default function Dashboard({ session }) {
    const [subscriptions, setSubscriptions] = useState();
    const [isSubscriptionsLoading, setSubscriptionsLoading] = useState();

    useEffect(() => {
        setSubscriptionsLoading(true);
        fetch('/api/subscriptions')
            .then(res => res.json())
            .then(data => {
                setSubscriptions(data);
                setSubscriptionsLoading(false);
            })
    }, []);

    return (
    <>
        <h1>Hello {session.user.name} </h1>
        <Link href="api/auth/signout"><btn>Sign out</btn></Link>
        {isSubscriptionsLoading && <h3>Fetching data from YouTube...</h3>}
        {!isSubscriptionsLoading && <Subscriptions subscriptions={subscriptions}></Subscriptions>}
    </>
    )
}