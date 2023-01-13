import Image from "next/image";
import Link from "next/link";

import numeral from "numeral";

export default function Subscriptions({ subscriptions }) {
    console.log(subscriptions);

    if(!subscriptions) return;

    const listItems = subscriptions.map(sub => {
        let {
            channelId,
            title,
            description,
            thumbnails,
            subscriberCount,
            videoCount,
            viewCount
        } = sub;
        subscriberCount = numeral(subscriberCount).format('0.[00]a');
        videoCount = numeral(videoCount).format('0.[00]a');
        viewCount = numeral(viewCount).format('0.[00]a');
        if(!description) description = '<no description>';

        return (
            <li key={channelId}>
                <div className="flex items-center bg-neutral-800 p-2 mb-1 rounded-xl">
                    <Image
                        src={thumbnails.default.url}
                        alt="Channel Logo"
                        width={88} height={88}
                        className="rounded-full p-1 drop-shadow-lg"
                    />
                    <div className="flex flex-col grow max-w-3xl">
                        <Link href={`https://youtube.com/channel/${channelId}`} className="max-w-fit text-gray-500 text-lg hover:text-gray-400 hover:scale-[102%]">
                            <span className="">{title}</span>
                        </Link>
                        <div className="text-gray-100 text-xs w-fit pr-4 max-h-24 leading-5 overflow-y-hidden overflow-ellipsis">{description}</div>
                        <div className="flex self-end mt-2">
                            <span className="bg-black outline outline-2 rounded-full text-center align-middle text-gray-300 text-xs font-mono mr-2 px-1">{subscriberCount} subs</span>
                            <span className="bg-black outline outline-2 rounded-full text-center align-middle text-gray-300 text-xs font-mono mr-2 px-1">{videoCount} videos</span>
                            <span className="bg-black outline outline-2 rounded-full text-center align-middle text-gray-300 text-xs font-mono mr-2 px-1">{viewCount} views</span>
                        </div>
                    </div>
                </div>
            </li>
        )
    })

    return (
    <>
        <h1 className="">Subscriptions: </h1>
        <ul>
            {listItems ?? listItems}
        </ul>
    </>
    )
}