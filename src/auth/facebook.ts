import axios from 'axios';

export type FacebookUserInfo = {
    facebookId: string,
    name: string,
    profilePicture?: string,
};
export async function getUserInfo(token: string): Promise<FacebookUserInfo | undefined> {
    const url = `https://graph.facebook.com/me?access_token=${token}`;
    const response = await axios.get(url);
    const data = response.data;
    if (data.id && data.name) {
        return {
            facebookId: data.id,
            name: data.name,
            profilePicture: data.profile_pic,
        };
    } else {
        return undefined;
    }
}
