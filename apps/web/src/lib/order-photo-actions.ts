import { adminApi } from './admin-api';

type ComboPhoto = {
  id: string;
  filename: string;
  folderLabel?: string | null;
  productName?: string | null;
  imageUrl: string | null;
};

type ComboWithPhotos = {
  comboName: string;
  comboCode: string;
  photos: ComboPhoto[];
};

export function printComboPhotos(combo: ComboWithPhotos) {
  const printablePhotos = combo.photos.filter((photo) => photo.imageUrl);
  if (printablePhotos.length === 0) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const imagesHtml = printablePhotos
    .map(
      (photo) => `
        <figure>
          <img src="${photo.imageUrl}" alt="${photo.filename}" />
          <figcaption>${photo.productName ?? photo.folderLabel ?? photo.filename}</figcaption>
        </figure>
      `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${combo.comboName} - Photos</title>
        <style>
          body { margin: 0; padding: 24px; font-family: sans-serif; }
          figure { margin: 0 0 24px; page-break-after: always; }
          img { max-width: 100%; height: auto; display: block; }
          figcaption { margin-top: 8px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>${combo.comboName}</h1>
        <p>Combo code: ${combo.comboCode}</p>
        ${imagesHtml}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
  };
}

export async function downloadComboPhotos(
  orderId: string,
  comboId: string,
  photos: ComboPhoto[]
) {
  const downloadable = photos.filter((photo) => photo.imageUrl);
  for (let index = 0; index < downloadable.length; index += 1) {
    const photo = downloadable[index];
    await adminApi.downloadOrderPhoto(orderId, comboId, photo.id, photo.filename);
    if (index < downloadable.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}
