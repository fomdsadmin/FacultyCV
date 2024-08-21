const { CognitoJwtVerifier } = require("aws-jwt-verify");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const getPresignedUrl = async (fileKey, type) => {
    const s3Client = new S3Client();
    const commandFunction = type == "GET" ? GetObjectCommand : PutObjectCommand;
    const command = new commandFunction({ Bucket: process.env.BUCKET_NAME, Key: fileKey });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

exports.lambda_handler = async(event, context) => {
    const jwt = event['arguments']['jwt'];
    const fileKey = event['arguments']['key'];
    const type = event['arguments']['type'];

    const verifier = CognitoJwtVerifier.create({
        userPoolId: process.env.USER_POOL_ID,
        tokenUse: "access",
        clientId: process.env.CLIENT_ID
    });

    // First check if the JWT token is valid
    let payload = null;
    try {
        payload = await verifier.verify(jwt);
        console.log('Token valid!')
    } catch (error) {
        console.log("Token not valid!");
        console.log(error);
        return "FAILURE";
    }

    // To store/get multiple tenant's CV's separately
    const actualFileKey = payload.username + '/' + fileKey;

    const url = await getPresignedUrl(actualFileKey, type);

    return url;
}