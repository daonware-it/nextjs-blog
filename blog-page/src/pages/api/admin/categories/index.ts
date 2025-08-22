import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../../lib/prisma';
import { createAuditLog } from '../../../../lib/auditLogUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // Überprüfen, ob der Benutzer authentifiziert und ein Admin oder Moderator ist
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  // GET-Methode: Alle Kategorien abrufen
  if (req.method === 'GET') {
    try {
      const categories = await prisma.category.findMany({
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: { posts: true, children: true }
          }
        },
        orderBy: { name: 'asc' }
      });
      
      return res.status(200).json(categories);
    } catch (error) {
      console.error('Fehler beim Abrufen der Kategorien:', error);
      return res.status(500).json({ error: 'Fehler beim Abrufen der Kategorien' });
    }
  }
  
  // POST-Methode: Neue Kategorie erstellen
  else if (req.method === 'POST') {
    const { name, slug, description, color, parentId } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name und Slug sind erforderlich' });
    }
    
    try {
      // Überprüfen, ob der Slug bereits existiert
      const existingCategory = await prisma.category.findUnique({
        where: { slug }
      });
      
      if (existingCategory) {
        return res.status(400).json({ error: 'Eine Kategorie mit diesem Slug existiert bereits' });
      }
      
      // Neue Kategorie erstellen
      const newCategory = await prisma.category.create({
        data: {
          name,
          slug,
          description,
          color,
          parentId: parentId ? parseInt(parentId) : null
        }
      });
      
      // Audit-Log für die Erstellung einer neuen Kategorie
      await createAuditLog({
        userId: (session.user as any).id,
        adminId: (session.user as any).id,
        action: 'CATEGORY_CREATE',
        details: `Neue Kategorie "${name}" erstellt`,
        newValue: `ID: ${newCategory.id}, Name: ${name}, Slug: ${slug}`
      });
      
      return res.status(201).json(newCategory);
    } catch (error) {
      console.error('Fehler beim Erstellen der Kategorie:', error);
      return res.status(500).json({ error: 'Fehler beim Erstellen der Kategorie' });
    }
  }
  
  // Andere Methoden nicht erlaubt
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Methode ${req.method} nicht erlaubt` });
  }
}
