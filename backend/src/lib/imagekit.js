import ImageKit, { toFile } from "@imagekit/nodejs";

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

function hasImageKitConfig() {
  return Boolean(process.env.IMAGEKIT_PRIVATE_KEY);
}

function createFileName(originalName = "resume.pdf") {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `resume-${Date.now()}-${safeName}`;
}

async function uploadResumePdf(file) {
  const fileName = createFileName(file.originalname);

  const result = await imagekit.files.upload({
    file: await toFile(file.buffer, fileName, {
      type: file.mimetype || "application/pdf",
    }),
    fileName,
    folder: "/resumes",
  });

  return result.url;
}

export { uploadResumePdf, hasImageKitConfig };