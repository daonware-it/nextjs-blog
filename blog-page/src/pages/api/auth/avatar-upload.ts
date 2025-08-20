import { getServerSession } from "next-auth/next";
import authOptions from "./[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";
import { promises as fs } from "fs";
import path from "path";
import { IncomingForm } from "formidable";
import { PrismaClient } from "@prisma/client";
import { Session } from "next-auth";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const session = (await getServerSession(req, res, authOptions)) as Session | null;
  if (!session || !session.user?.email) return res.status(401).json({ error: "Nicht authentifiziert." });

  const form = new IncomingForm({ maxFileSize: 2 * 1024 * 1024 }); // 2MB

  form.parse(req, async (err, _, files) => {
    if (err) return res.status(400).json({ error: "Datei zu groß oder ungültig." });
    const avatarFile = files.avatar;
    const file = Array.isArray(avatarFile) ? avatarFile[0] : avatarFile;
    if (!file) return res.status(400).json({ error: "Kein Bild hochgeladen." });

    const ext = path.extname(file.originalFilename || "").toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      return res.status(400).json({ error: "Nur JPG, PNG oder WEBP erlaubt." });
    }

    const uploadDir = path.join(process.cwd(), "public", "avatars");
    await fs.mkdir(uploadDir, { recursive: true });
    const filename = `${session.user.email.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}${ext}`;
    const destPath = path.join(uploadDir, filename);

    // Altes Bild löschen
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user?.avatarUrl) {
      const oldPath = path.join(process.cwd(), "public", user.avatarUrl.replace(/^\//, ""));
      try {
        await fs.unlink(oldPath);
      } catch (e) {
        // Datei existiert nicht oder konnte nicht gelöscht werden
      }
    }

    await fs.copyFile(file.filepath, destPath);

    const avatarUrl = `/avatars/${filename}`;
    await prisma.user.update({
      where: { email: session.user.email },
      data: { avatarUrl },
    });
    return res.status(200).json({ avatarUrl });
  });
}
