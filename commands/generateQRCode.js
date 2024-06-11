import QRCode from 'qrcode';

async function generateQRCode(data, fileName) {
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(data);
        const pngBuffer = Buffer.from(qrCodeDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');

        return { fileName, pngBuffer };
    } catch (error) {
        console.error(`Error generating QR Code for ${fileName}:`, error);
        throw error; // Re-throw the error to propagate it to the caller
    }
}

export default generateQRCode;
