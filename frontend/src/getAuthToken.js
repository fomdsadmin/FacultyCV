import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';

export const getJWT = async () => {
    return (await fetchAuthSession()).tokens?.accessToken?.toString();
};

export const getUserId = async () => {
    return (await fetchUserAttributes()).sub;
};