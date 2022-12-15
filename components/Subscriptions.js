export default function Subscriptions({ subscriptions }) {
    console.log(subscriptions);

    const listItems = subscriptions.map(sub => {
        return (
            <li key={sub.channelId}>
                <h6>{sub.title}</h6>
                <p>{sub.description}</p>
            </li>
        )
    })

    return (
    <>
        <h1>Subscriptions: </h1>
        <ul>
            {listItems}
        </ul>
    </>
    )
}