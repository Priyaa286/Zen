# Zen Global - Multi-Vendor Media & Asset Upload API Specification

This specification documents the REST API contract for merchant asset uploads (profile photos, store logos, banners, product imagery).

## Base Endpoint
`POST /api/v1/uploads`

## Request Headers
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: multipart/form-data`

## Multipart Form Data Fields
| Field Name | Type | Required | Description | Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `file` | Binary File | Yes | Image asset to upload | JPG, JPEG, PNG, WebP; Max 5MB |
| `folder` | String | Yes | Destination namespace | `profiles`, `stores`, `products` |
| `altText` | String | No | Accessibility text | Max 200 characters |

## Success Response (201 Created)
```json
{
  "id": "upload_98a72b01",
  "url": "https://storage.zen.global/assets/stores/store-tokyo-optics-logo.webp",
  "fileName": "tokyo_optics_logo.png",
  "fileSize": 182400,
  "mimeType": "image/png",
  "folder": "stores",
  "uploadedAt": "2026-11-12T17:35:00.000Z"
}
```

## Error Responses
- `400 Bad Request`: `{"error": "INVALID_MIME_TYPE", "message": "Only JPG, PNG, and WebP are supported."}`
- `413 Payload Too Large`: `{"error": "FILE_TOO_LARGE", "message": "File exceeds maximum size limit of 5MB."}`
- `401 Unauthorized`: `{"error": "UNAUTHORIZED", "message": "Valid merchant JWT token required."}`

