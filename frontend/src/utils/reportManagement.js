import { getJWT } from "../getAuthToken";
import { getPresignedUrl } from "../graphql/graphqlHelpers";

export const uploadLatexToS3 = async (latex, key) => {
    // Get presigned URL
    const jwt = await getJWT()
    const url = await getPresignedUrl(jwt, key, 'PUT');
    // Upload file to S3
    const response = await fetch(url, {
      method: 'PUT',
      body: latex,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
    if (!response.ok)
      throw new Error(`Failed to upload: ${response.statusText}`);
    else
      
    return;
} 

// Waits for PDF to be available
export const getDownloadUrl = async (key, tryNumber) => {
  const jwt = await getJWT()
  const url = await getPresignedUrl(jwt, key, 'GET');
  if (url === "WAIT") {
    // Wait for 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (tryNumber > 120) throw new Error("Timeout waiting for PDF to be available");
    return await getDownloadUrl(key, tryNumber+1);
  }
  return url;
}