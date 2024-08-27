import { fetchAuthSession } from 'aws-amplify/auth';

export const getJWT = async () => {
    return (await fetchAuthSession()).tokens?.accessToken?.toString();
};