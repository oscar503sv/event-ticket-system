// src/utils/qr.util.ts
import QRCode from "qrcode";

/**
 * Genera un código QR a partir de datos
 * @param data - Datos a codificar en el QR (típicamente el código del ticket)
 * @returns Data URL del QR code en formato base64
 */
export async function generateQR(data: string): Promise<string> {
  try {
    // Generar QR code como data URL
    const qrDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: "M",
      type: "image/png",
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return qrDataUrl;
  } catch (error) {
    throw new Error(`Error generando código QR: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Genera un código QR como buffer (útil para guardarlo como archivo)
 * @param data - Datos a codificar en el QR
 * @returns Buffer del QR code
 */
export async function generateQRBuffer(data: string): Promise<Buffer> {
  try {
    const qrBuffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: "M",
      type: "png",
      width: 300,
      margin: 2,
    });

    return qrBuffer;
  } catch (error) {
    throw new Error(`Error generando código QR: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
