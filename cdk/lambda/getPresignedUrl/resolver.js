const { JwtRsaVerifier } = require("aws-jwt-verify");
const { validateCognitoJwtFields } = require("aws-jwt-verify/cognito-verifier");
const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const getPresignedUrl = async (fileKey, type, bucketName) => {
    const s3Client = new S3Client();
    const commandFunction = type == "GET" ? GetObjectCommand : PutObjectCommand;
    const command = new commandFunction({ Bucket: bucketName, Key: fileKey });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

const getLastModified = async (fileKey, bucketName) => {
    const s3Client = new S3Client();
    const input = {
        Bucket: bucketName,
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
    const purpose = event['arguments']['purpose'] || "cv"; // Add this argument

    console.log(purpose)

    const verifier = JwtRsaVerifier.create([{
        issuer: process.env.USER_POOL_ISS,
        audience: null,
        customJwtCheck: ({payload}) => validateCognitoJwtFields(payload, {
                tokenUse: "access",
                clientId: process.env.CLIENT_ID,
        }),
    },
    // Add more IDPs here
    ]);

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

    let bucketName;
    let actualFileKey;
    if (purpose === "user-import") {
        bucketName = process.env.USER_IMPORT_BUCKET_NAME;
        actualFileKey = 'import/' + fileKey; // Use import/ prefix to match S3 event notifications
        console.log("Send to user import bucket");
    } else {
        bucketName = process.env.BUCKET_NAME;
        actualFileKey = payload.username + '/' + fileKey;
        console.log("Send to CV bucket");
    }

    // For CV GET requests, check freshness
    if (purpose === "cv" && type == "GET") {
        const lastModifiedLatex = await getLastModified(actualFileKey.replace('pdf', 'tex'), bucketName);
        const lastModifiedPdf = await getLastModified(actualFileKey, bucketName);
        if (lastModifiedLatex == -1 || lastModifiedPdf == -1 || lastModifiedLatex > lastModifiedPdf) {
            return "WAIT";
        }
    }

    const url = await getPresignedUrl(actualFileKey, type, bucketName);
    return url;
}