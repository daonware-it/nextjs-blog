import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Ungültige Kategorie-ID' });
  }

  // Überprüfen, ob der Benutzer authentifiziert und ein Admin oder Moderator ist
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const categoryId = parseInt(id);

  // GET-Methode: Einzelne Kategorie abrufen
  if (req.method === 'GET') {
    try {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          children: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          posts: {
            select: {
              id: true,
              title: true,
              published: true
            }
          }
        }
      });
      
      if (!category) {
        return res.status(404).json({ error: 'Kategorie nicht gefunden' });
      }
      
      return res.status(200).json(category);
    } catch (error) {
      console.error('Fehler beim Abrufen der Kategorie:', error);
      return res.status(500).json({ error: 'Fehler beim Abrufen der Kategorie' });
    }
  }
  
  // PUT-Methode: Kategorie aktualisieren
  else if (req.method === 'PUT') {
    const { name, slug, description, color, parentId } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name und Slug sind erforderlich' });
    }
    
    try {
      // Überprüfen, ob der Slug bereits für eine andere Kategorie verwendet wird
      const existingCategory = await prisma.category.findFirst({
        where: {
          slug,
          id: { not: categoryId }
        }
      });
      
      if (existingCategory) {
        return res.status(400).json({ error: 'Eine andere Kategorie mit diesem Slug existiert bereits' });
      }
      
      // Überprüfen, ob der Elternteil existiert
      if (parentId && parentId !== 'null') {
        const parentIdInt = parseInt(parentId);
        
        if (parentIdInt === categoryId) {
          return res.status(400).json({ error: 'Eine Kategorie kann nicht sich selbst als Elternkategorie haben' });
        }
        
        const parent = await prisma.category.findUnique({
          where: { id: parentIdInt }
        });
        
        if (!parent) {
          return res.status(400).json({ error: 'Elternkategorie nicht gefunden' });
        }
      }
      
      // Kategorie aktualisieren
      const updatedCategory = await prisma.category.update({
        where: { id: categoryId },
        data: {
          name,
          slug,
          description,
          color,
          parentId: parentId && parentId !== 'null' ? parseInt(parentId) : null,
          updatedAt: new Date()
        }
      });
      
      return res.status(200).json(updatedCategory);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Kategorie:', error);
      return res.status(500).json({ error: 'Fehler beim Aktualisieren der Kategorie' });
    }
  }
  
  // DELETE-Methode: Kategorie löschen
  else if (req.method === 'DELETE') {
    try {
      // Überprüfen, ob die Kategorie Unterkategorien hat
      const childCategories = await prisma.category.findMany({
        where: { parentId: categoryId }
      });
      
      if (childCategories.length > 0) {
        return res.status(400).json({ 
          error: 'Diese Kategorie hat Unterkategorien. Bitte entfernen Sie zuerst alle Unterkategorien.' 
        });
      }
      
      // Zuerst die Verknüpfung zu Posts entfernen
      // Alle Posts finden, die diese Kategorie verwenden
      const postsWithCategory = await prisma.post.findMany({
        where: {
          categories: {
            some: { id: categoryId }
          }
        },
        select: { id: true }
      });
      
      // Für jeden Post die Kategorie entfernen
      for (const post of postsWithCategory) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            categories: {
              disconnect: { id: categoryId }
            }
          }
        });
      }
      
      // Dann die Kategorie löschen
      await prisma.category.delete({
        where: { id: categoryId }
      });
      
      return res.status(200).json({ message: 'Kategorie erfolgreich gelöscht' });
    } catch (error) {
      console.error('Fehler beim Löschen der Kategorie:', error);
      return res.status(500).json({ error: 'Fehler beim Löschen der Kategorie' });
    }
  }
  
  // Andere Methoden nicht erlaubt
  else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Methode ${req.method} nicht erlaubt` });
  }
}
