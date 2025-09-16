// lib/google-auth.ts

/**
 * Decodes the Base64 encoded Google private key from environment variables.
 * This function centralizes the logic for handling the private key,
 * ensuring it can be securely accessed by any Google service in the app.
 *
 * @returns {object} The parsed credentials object containing the private_key.
 * @throws {Error} If the environment variable is not set.
 */
export function getDecodedGoogleCredentials() {
  // Try the Base64 version first, then fallback to the direct private key
  const privateKeyBase64 = process.env.GOOGLE_PRIVATE_KEY_BASE64;
  const privateKeyDirect = process.env.GOOGLE_PRIVATE_KEY;

  if (privateKeyBase64) {
    // Decode the Base64 string back into the original JSON content
    const decodedKey = Buffer.from(privateKeyBase64, "base64").toString("utf8");
    // Parse the JSON string to get a usable object
    const credentials = JSON.parse(decodedKey);
    return credentials;
  } else if (privateKeyDirect) {
    // Use the direct private key from environment
    return {
      private_key: privateKeyDirect.replace(/\\n/g, '\n') // Handle escaped newlines
    };
  } else {
    throw new Error(
      "Neither GOOGLE_PRIVATE_KEY_BASE64 nor GOOGLE_PRIVATE_KEY environment variable is set.",
    );
  }
}