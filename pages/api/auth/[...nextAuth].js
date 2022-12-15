import NextAuth from "next-auth";
import GoogleProvider from 'next-auth/providers/google';

// might need to refresh access tokens later: https://next-auth.js.org/tutorials/refresh-token-rotation

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            authorization: {
                params: {
                    access_type: 'online',
                    scope: [
                        'https://www.googleapis.com/auth/userinfo.profile',
                        'https://www.googleapis.com/auth/userinfo.email',
                        'https://www.googleapis.com/auth/youtube.readonly',
                    ].join(' '),
                    include_granted_scopes: true,
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account, profile, isNewUser }){
            // initial sign in
            if(account && user) {
                return {
                    accessToken: account.access_token,
                    accessTokenExpires: Date.now() + account.expires_at * 1000,
                    refreshToken: account.refresh_token,
                    user
                }
            }

            // TODO - add refresh https://next-auth.js.org/tutorials/refresh-token-rotation
            return token;
        },
        async session({ session, token }) {

            // include the api access token in the client session data
            session.user = token.user;
            session.accessToken = token.accessToken;

            return session;
        }
    }
};

export default NextAuth(authOptions);