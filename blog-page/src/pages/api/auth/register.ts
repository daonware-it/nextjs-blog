import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const { email, password, name, fullName, username, captchaToken } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, Benutzername und Passwort erforderlich' });
    }
    // reCAPTCHA-Validierung
    if (!captchaToken) {
      return res.status(400).json({ error: 'Captcha erforderlich.' });
    }
    const verifyRes = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${captchaToken}`, { method: 'POST' });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return res.status(400).json({ error: 'Captcha ungültig.' });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUser || existingUsername) {
      // Neutrale Fehlermeldung, keine Info ob E-Mail oder Benutzername existiert
      return res.status(409).json({ error: 'Registrierung nicht möglich. Bitte überprüfe deine Eingaben.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        username,
        role: 'LESER',
        permissions: [],
      }
    });
    const user = await prisma.user.findUnique({
      where: { id: createdUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        createdAt: true,
      }
    });
    return res.status(201).json({ message: 'Benutzer erstellt', user });
  } catch (error) {
    console.error(error);
    let message = 'Interner Serverfehler';
    if (typeof error === 'object' && error !== null) {
      if ('message' in error && typeof error.message === 'string') {
        message = error.message;
      } else {
        message = JSON.stringify(error);
      }
    } else if (typeof error === 'string') {
      message = error;
    }
    res.status(500).json({ error: message });
  }
}
