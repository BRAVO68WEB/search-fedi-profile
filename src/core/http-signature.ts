import crypto from "node:crypto";

// KeyId must point to a real actor with a published public key
// Set SIGNATURE_BASE_URL env var to your server's base URL
const BASE_URL = process.env.SIGNATURE_BASE_URL ?? "https://search-fedi-profile.github.io";
const KEY_ID = `${BASE_URL}/actor#main-key`;

// Static RSA key pair for HTTP Signatures
// The public key is served at /actor endpoint
const STATIC_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtw6xfQZygYIPAoMCc75X
w3htKgjEZTKgahMf9kAAk6BfZH4UWpvfbVSmNvcdS600ZbGpOeASfxokLInyRSU0
N6UQz8qwZn0Ovms23fGtElDMGeoqxlDurUH5CpuqKmQjKdN8qoMHCWqB3r/eee7S
haEHXPm5nXKNdO+ZSeZlLiBdMb1s1+Z5WirUsCSFsS4spGRSMWBCw3LvFbTkGIsd
TZxMFmm9PN3+emvN4nYw/MFfaI/MXu+hyGJ7UNsFOE7AspJb/DaLvS1/132jgX2J
99HSj5y2KjET0LNWTP9Lu685fgmJrie3mdBLRrvCUUH71992efPaYfjfwHAtu6Cj
/wIDAQAB
-----END PUBLIC KEY-----`;

const STATIC_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3DrF9BnKBgg8C
gwJzvlfDeG0qCMRlMqBqEx/2QACToF9kfhRam99tVKY29x1LrTRlsak54BJ/GiQs
ifJFJTQ3pRDPyrBmfQ6+azbd8a0SUMwZ6irGUO6tQfkKm6oqZCMp03yqgwcJaoHe
v9557tKFoQdc+bmdco1075lJ5mUuIF0xvWzX5nlaKtSwJIWxLiykZFIxYELDcu8V
tOQYix1NnEwWab083f56a83idjD8wV9oj8xe76HIYntQ2wU4TsCyklv8Nou9LX/X
faOBfYn30dKPnLYqMRPQs1ZM/0u7rzl+CYmuJ7eZ0EtGu8JRQfvX33Z589ph+N/A
cC27oKP/AgMBAAECggEAKQRBT7bMnGkkbNcnCwEo0BMhPqxlORmdaPctD7OqjWl/
Rlibveu0Jd60OZeoOEcweOLUfLPQ4Srd1R75qnWaHCe/uxd67BP0ZEVIr3VR5ss0
2E+oUvRabnbcUvyrJcF3QY1yHxCp2HnFbMBIHMEe6bM5n6MS7Iz41i1DhxP5MtrL
LyAl/c2XxxPO2DLqsQIsqdzHvsQiaQqdp8zdUy48Boy93SByxPIed9+ei4zmz/s3
V9BYOKuABqoA2Yzc3YKEKdXx3IAdiZtYn/OyJRoRVJnj5cZWyJLIQC0v2ItkkbSM
pyRiAQXyzFAjoS9oqQ6mAf3X43+AS+xxPYABTD95PQKBgQDs5EtPApgzKq0IBmQU
KV5hGxQYMe70K9a6FCLE2C6ms9fW1lAO25KUpG71k+p0kHW13X7NfEEqkE4nO7Pv
cOgtLP0AfSALjS93DyrnwBP8cLwEqug3NvOV8CLV2+fVyrtrWbBvkT3NmZ1Sm7Bk
nfTEWMbLyfFnykCox7+t0tK7TQKBgQDF0r57NQNsNGW77U0onekqktm0PVm76edi
iyMRyIpuchNjlYA3m8bVlTQuCEgbEhqHifk5g3lgs3aiheYupB4eyC+GmfHCYMXZ
7xSkkpvZZ0P1hnTNWXWhUeZVnNqZUguaryJiiF+rtPU2+CJNYiTdvQolmGyV3s8B
h9AeWRQ+ewKBgQDCjM9oiSn0Q6UthQomIL95IqMDJ+cmMua7lZPkc+MEV4j40LOZ
MC0W1GCoYR1ZM9boUIs2OUjPqwn0YKzrBaA4kc0K3Lg3pHEJ57QF9pKzbOaNMstZ
pVCxoDELz/l7dG8tv9AOIItQUkuJL4HTcII3yu0hKq2O3uTxeHLsT8tvtQKBgQCq
SqBur1Qi8XgiLkUdkdIGNCP0ZFu6x7/HtL6bsGZ6bPkD4M5fEFo5whcJCVgI9ayg
wMUqHWN/Ov4FKf7cZ6sGFI3U8PCMw4GN+aFrikle/OYjlXs2yqvYEwiU6lHDaj1T
CzAuYfb5eO0eRLxCoRnbR8BUXMIcwZCxYJhnh4dFwQKBgE82AJJ6a+ul3W2dFtBk
Mjm6UuGmEYmeJyVui4KbLMJ/Qpt+/WDd2ru40kfltF3JpqvgxlgAdknldV2SrubL
TRZ0FVV4K+vQ95R5JxlalDX8ZcDKyCpRxBHhzYb2IK9WJ1fLw3JpYPPP9Zn5ALfn
bqhhMvrepnNxIMsr6F6NJDFq
-----END PRIVATE KEY-----`;

export function getOrCreateRSAKeys(): { publicKey: string; privateKey: string } {
  return { publicKey: STATIC_PUBLIC_KEY, privateKey: STATIC_PRIVATE_KEY };
}

/**
 * Sign an HTTP request using Draft Cavage HTTP Signatures
 * This is the format used by most Mastodon instances
 */
export function signRequestDraftCavage(
  url: string,
  headers: Record<string, string>,
  privateKeyPem: string,
): Record<string, string> {
  const parsedUrl = new URL(url);
  const date = new Date().toUTCString();

  // Construct the signing string (Draft Cavage format)
  const signingString = [
    `(request-target): get ${parsedUrl.pathname}`,
    `host: ${parsedUrl.host}`,
    `date: ${date}`,
  ].join("\n");

  // Sign with RSA-SHA256
  const signature = crypto.sign("sha256", Buffer.from(signingString), privateKeyPem);
  const signatureBase64 = signature.toString("base64");

  // Construct Signature header (Draft Cavage format)
  const signatureHeader = [
    `keyId="${KEY_ID}"`,
    `algorithm="rsa-sha256"`,
    `headers="(request-target) host date"`,
    `signature="${signatureBase64}"`,
  ].join(",");

  return {
    ...headers,
    Host: parsedUrl.host,
    Date: date,
    Signature: signatureHeader,
  };
}
