import axios from 'axios';

export type FacebookUserInfo = {
    facebookId: string,
    name: string,
    profilePicture?: string,
};
export async function getFbUserInfo(token: string): Promise<FacebookUserInfo | undefined> {
    const url = `https://graph.facebook.com/me?
    fields=name,picture
    &access_token=${token}`;

    try {
        const response = await axios.get(url);
        const data = response.data;
        if (data.id && data.name) {
            const pictureUrl = data.picture
                && data.picture.data
                && data.picture.data.url;
            return {
                facebookId: data.id,
                name: data.name,
                profilePicture: pictureUrl,
            };
        } else {
            return undefined;
        }
    } catch (e) {
        return undefined;
    }
}
