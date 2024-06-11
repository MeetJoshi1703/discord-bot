import axios from 'axios';
import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';
import JSZip from 'jszip';
import generateQRCode from './generateQRCode.js';
import { fileURLToPath } from 'url';
import {AttachmentBuilder, EmbedBuilder,ModalBuilder, TextInputBuilder, TextInputStyle,ActionRowBuilder } from 'discord.js';
import QRCode from 'qrcode';

const zip = new JSZip();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



async function handleGenerateQRCommand(interaction) {
  await interaction.deferReply();
  await interaction.followUp("Holup...Let him cook");

  try {
    const message = interaction.options.getString('input');
    const temporaryFilePath = path.join(__dirname, '..', 'temp_qr_code.png');

    const response = await axios.get(
      `https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${encodeURIComponent(
        message
      )}&choe=UTF-8`,
      { responseType: 'stream' }
    );

    const fileWriter = fs.createWriteStream(temporaryFilePath);
    response.data.pipe(fileWriter);

    await new Promise((resolve, reject) => {
      fileWriter.on('finish', resolve);
      fileWriter.on('error', reject);
    });

    const tempFileAttachment = new AttachmentBuilder(temporaryFilePath);
    const embed = new EmbedBuilder()
      .setTitle(`Here's the QR Code You Requested`)
      .setAuthor({
        name: `${interaction.user.username}`,
        iconURL: `${interaction.user.avatarURL({ format: 'png', size: 256 })}`,
      })
      .setColor(0x0099ff)
      .setImage('attachment://temp_qr_code.png')
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed], files: [tempFileAttachment] });

    fs.unlink(temporaryFilePath, (err) => {
      if (err) {
        console.error('Error deleting temporary QR code file:', err);
      } else {
        console.log('Temporary QR code file deleted successfully.');
      }
    });

  } catch (error) {

    console.error('Error generating or sending QR code:', error);
    await interaction.reply({
      content: 'An error occurred while generating the QR code.',
      ephemeral: true,
    });

  }
  
}

async function handleGenerateBulkQRCommand(interaction) {
  const file = interaction.options.getAttachment('file');

  try {
    const response = await axios.get(file.url, { responseType: 'arraybuffer' });
    const workbook = xlsx.read(response.data, { type: 'buffer' });

    // Assuming there is only one sheet in the Excel file
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON object
    const data = xlsx.utils.sheet_to_json(sheet);

    await interaction.reply('Generating QR codes... Please wait.');

    // Generate QR codes for all data (with proper awaiting)
    const qrCodePromises = data.map(async (dataItem, index) => {
      const fileName = `${dataItem.id}_${dataItem.name}.png`;

      // Ensure correct vCard data formatting (remove extra space)
      const vCardData = `BEGIN:VCARD
VERSION:4.0
N:${dataItem.name}
FN:${dataItem.name}
EMAIL;TYPE=INTERNET:${dataItem.email}
ORG:${dataItem.company}
TITLE:${dataItem.title}
TEL;TYPE=WORK,VOICE:${dataItem.number}
URL:${dataItem.url}
ADR;TYPE=WORK:${dataItem.address}
END:VCARD`;

      try {
        // Generate QR code and await the result (pngBuffer)
        const { pngBuffer } = await generateQRCode(vCardData, fileName);
        return { fileName, pngBuffer };
      } catch (error) {
        console.error(`Error generating QR Code for ${fileName}:`, error);
        // Handle individual QR code generation errors (optional)
        // You can choose to skip this entry, retry, or log the error
        return null; // Or throw an error to propagate
      }
    });

    // Wait for all QR codes to be generated (or potentially handle errors)
    const qrCodeBuffers = await Promise.all(qrCodePromises);

    // Filter out any failed QR code generation (if applicable)
    const successfulBuffers = qrCodeBuffers.filter(buffer => buffer);

    // Add successful QR code buffers to the zip file
    successfulBuffers.forEach(({ fileName, pngBuffer }) => {
      zip.file(fileName, pngBuffer);
    });

    // Generate the zip file
    const zipFileName = 'bulkqr.zip';
    const zipFile = await zip.generateAsync({ type: 'nodebuffer' });

    // Save the zip file (consider using a non-blocking alternative)
    fs.writeFileSync(path.join(__dirname, zipFileName), zipFile);
    console.log('Zip folder created successfully.');

    // Send the zip file to the user
    await interaction.followUp({
      content: 'Bulk QR codes generated successfully!',
      files: [path.join(__dirname, zipFileName)],
    });

    // Delete the zip file (consider using a non-blocking alternative)
    fs.unlink(path.join(__dirname, zipFileName), (err) => {
      if (err) {
        console.error('Error deleting zip file:', err);
      } else {
        console.log('Zip file deleted successfully.');
      }
    });

  } catch (error) {
    console.error('Error generating bulk QR codes:', error);
    await interaction.reply('An error occurred while generating bulk QR codes.');
  }
}

async function handleVcardModal(interaction){
  
  const modal = new ModalBuilder()
    .setCustomId('VCardQR')
    .setTitle('VCard Form');

  const nameInput = new TextInputBuilder()
  .setCustomId('nameInput')
  .setLabel("Enter your fullname?")
  .setStyle(TextInputStyle.Short)
  .setRequired(true);

  const emailInput = new TextInputBuilder()
  .setCustomId('emailInput')
  .setLabel("Enter your email ID ?")
  .setStyle(TextInputStyle.Short)
  .setRequired(true);

  const companyInput = new TextInputBuilder()
  .setCustomId('companyInput')
  .setLabel("Enter your company")
  .setStyle(TextInputStyle.Short)
  .setRequired(false);

  const titleInput = new TextInputBuilder()
  .setCustomId('titleInput')
  .setLabel("Enter your title")
  .setStyle(TextInputStyle.Short)
  .setRequired(false);

  const numberInput = new TextInputBuilder()
  .setCustomId('numberInput')
  .setLabel("Enter your number")
  .setStyle(TextInputStyle.Short)
  .setRequired(false);


  // An action row only holds one text input,
  // so you need one action row per text input.
  const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
  const secondActionRow = new ActionRowBuilder().addComponents(emailInput);
  const thirdActionRow = new ActionRowBuilder().addComponents(companyInput);
  const fourthActionRow = new ActionRowBuilder().addComponents(titleInput);
  const fifthActionRow = new ActionRowBuilder().addComponents(numberInput);
  

  // Add inputs to the modal
  modal.addComponents(
    firstActionRow, 
    secondActionRow,
    thirdActionRow,
    fourthActionRow,
    fifthActionRow,
  );

  // Show the modal to the user
  await interaction.showModal(modal);
  

}

async function handleGenerateVcardQRCommand(interaction) {
  // Fetch all the fields from the modal
  const name = interaction.fields.getTextInputValue('nameInput');
  const email = interaction.fields.getTextInputValue('emailInput');
  const company = interaction.fields.getTextInputValue('companyInput');
  const title = interaction.fields.getTextInputValue('titleInput');
  const number = interaction.fields.getTextInputValue('numberInput');

  // Construct vCard data
  const vCardData = `BEGIN:VCARD
VERSION:4.0
N:${name}
FN:${name}
EMAIL;TYPE=INTERNET:${email}
ORG:${company}
TITLE:${title}
TEL;TYPE=WORK,VOICE:${number}  
END:VCARD`;

  try {
    // Generate QR code
    const qrCodeFilePath = path.join(__dirname, '..', 'temp_vcard_qr.png');
    await QRCode.toFile(qrCodeFilePath, vCardData);

    // Send the QR code image to Discord
    const tempFileAttachment = new AttachmentBuilder(qrCodeFilePath);
    const embed = new EmbedBuilder()
      .setTitle(`Here's the vCard QR Code You Requested`)
      .setAuthor({
        name: `${interaction.user.username}`,
        iconURL: `${interaction.user.avatarURL({ format: 'png', size: 256 })}`,
      })
      .setColor(0x0099ff)
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed], files: [tempFileAttachment] });

    // Delete the temporary QR code file
    fs.unlink(qrCodeFilePath, (err) => {
      if (err) {
        console.error('Error deleting temporary vCard QR code file:', err);
      } else {
        console.log('Temporary vCard QR code file deleted successfully.');
      }
    });

    // Reply to the interaction
    await interaction.reply({ content: 'Your vCard QR code has been generated successfully!', ephemeral: true });
  } catch (error) {
    console.error('Error generating or sending vCard QR code:', error);
    await interaction.reply({
      content: 'An error occurred while generating the vCard QR code.',
      ephemeral: true,
    });
  }
}

export {
  handleGenerateQRCommand,
  handleGenerateBulkQRCommand,

  handleGenerateVcardQRCommand,
  handleVcardModal
};
