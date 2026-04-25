import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

type SaveManagementUndanganInput = {
  fileId: string;
  fileName: string;
  folderPath: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
};

export async function saveManagementUndanganFromUpload(
  input: SaveManagementUndanganInput,
): Promise<void> {
  try {
    await prisma.managementUndangan.create({
      data: {
        id: randomUUID(),
        fileId: input.fileId,
        fileName: input.fileName,
        folderPath: input.folderPath,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        uploadedAt: new Date(input.uploadedAt),
      },
    });
  } catch (error) {
    // Keep guest submission available even when management table is not migrated yet.
    console.warn("management_undangan insert skipped:", error);
  }
}
