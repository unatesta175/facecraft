import { FaceIndexStatus } from '@prisma/client';
import { prisma } from '../src/services/database.service';
import { indexPhotographerPhoto } from '../src/services/face-index.service';
import { rekognitionService } from '../src/services/rekognition.service';

async function main() {
  await rekognitionService.ensureCollectionExists();

  const photos = await prisma.photographerPhoto.findMany({
    where: {
      OR: [
        { faceIndexStatus: FaceIndexStatus.PENDING },
        { faceIndexStatus: FaceIndexStatus.FAILED },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Reindexing ${photos.length} photographer photo(s)...`);

  let indexed = 0;
  let failed = 0;
  let noFace = 0;

  for (const photo of photos) {
    await indexPhotographerPhoto(photo.id);

    const updated = await prisma.photographerPhoto.findUnique({
      where: { id: photo.id },
      select: { faceIndexStatus: true },
    });

    if (updated?.faceIndexStatus === FaceIndexStatus.INDEXED) {
      indexed += 1;
    } else if (updated?.faceIndexStatus === FaceIndexStatus.NO_FACE) {
      noFace += 1;
    } else {
      failed += 1;
    }

    console.log(`  ${photo.id}: ${updated?.faceIndexStatus ?? 'UNKNOWN'}`);
  }

  console.log(`Done. indexed=${indexed}, noFace=${noFace}, failed=${failed}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
