import { defineAuth, secret } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      oidc: [
        {
          name: 'staging-facultycv',
          clientId: secret('staging-facultycv'),
          clientSecret: secret('crZ8ZE7vGXSa9gi5o3DavS8BXv2mvMXG'),
          issuerUrl: 'https://broker.stg.id.ubc.ca/auth/realms/idb2',
        },
      ],
      logoutUrls: ['http://localhost:3000/'],
      callbackUrls: [
        'http://localhost:3000/'
      ],
    },
  },
});