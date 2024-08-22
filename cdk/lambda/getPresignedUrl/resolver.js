const { CognitoJwtVerifier } = require("aws-jwt-verify");
const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const getPresignedUrl = async (fileKey, type) => {
    const s3Client = new S3Client();
    const commandFunction = type == "GET" ? GetObjectCommand : PutObjectCommand;
    const command = new commandFunction({ Bucket: process.env.BUCKET_NAME, Key: fileKey });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

const getLastModified = async (fileKey) => {
    const s3Client = new S3Client();
    const input = {
        Bucket: process.env.BUCKET_NAME,
        Key: fileKey
    };
    try {
        const command = new HeadObjectCommand(input);
        const response = await s3Client.send(command);
        const lastModified = response.LastModified;
        return Math.floor(lastModified.getTime() / 1000);
    } catch (error) {
        if (error.name === 'NotFound') {
            return -1;
        }
        throw error;
    }
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

    // If the type is GET, then the corresponding .tex file should be created before the PDF requested
    // Else PDF is outdated and the requester needs to wait
    if (type == "GET") {
        const lastModifiedLatex = await getLastModified(actualFileKey.replace('pdf', 'tex'));
        const lastModifiedPdf = await getLastModified(actualFileKey);
        if (lastModifiedLatex == -1 || lastModifiedPdf == -1 || lastModifiedLatex > lastModifiedPdf) {
            return "WAIT";
        }
    }

    const url = await getPresignedUrl(actualFileKey, type);

    return url;
}