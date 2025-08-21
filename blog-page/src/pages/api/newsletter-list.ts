import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Cache-Header setzen, um sicherzustellen, dass keine Caching stattfindet
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  try {
    // Leere Array zurückgeben, wenn es noch keine Newsletter gibt
    // Dadurch werden 404-Fehler vermieden
    return res.status(200).json({ newsletters: [] });
  } catch (error) {
    console.error("Fehler beim Abrufen der Newsletter:", error);
    return res.status(500).json({ error: "Interner Serverfehler beim Abrufen der Newsletter" });
  }
}
