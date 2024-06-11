import QRCode from 'qrcode';
import fs from 'fs'

// vCard data
const vCardData = `BEGIN:VCARD
VERSION:4.0
N:Meet;
FN:Meet Joshi
EMAIL;TYPE=INTERNET:youremail@example.com
ORG:SVIT
TITLE:Student
TEL;TYPE=WORK,VOICE:+15551234567
ADR;TYPE=WORK:;;Your Address;Your City;Your State;Your Postal Code;Your Country
URL:https://www.yourwebsite.com
REV:2024-03-27T00:00:00Z
END:VCARD`;

// Generate QR code
QRCode.toFile('vcard_qr.png', vCardData, {
  type: 'png'
}, function (err) {
  if (err) throw err;
  console.log('QR code generated successfully');
});
