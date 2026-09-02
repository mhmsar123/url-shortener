import QRCode from "qrcode";

export async function generateQrPng(text: string, width = 512): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    type: "png",
    width,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#1e293b", light: "#ffffff" },
  });
}
