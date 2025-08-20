import React, { useState, useEffect } from 'react';
import styles from '../admin.module.css';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

interface KategorienProps {
  ensureSession: () => Promise<boolean>;
}

const Kategorien: React.FC<KategorienProps> = ({ ensureSession }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    slug: '',
    description: '',
    color: '#3b82f6'
  });
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  const predefinedColors = [
    { name: 'Blau', value: '#3b82f6' },
    { name: 'Rot', value: '#ef4444' },
    { name: 'Grün', value: '#10b981' },
    { name: 'Gelb', value: '#f59e0b' },
    { name: 'Lila', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Grau', value: '#6b7280' },
    { name: 'Dunkelblau', value: '#1d4ed8' }
  ];

  const fetchCategories = async () => {
    try {
      if (!(await ensureSession())) return;

      setIsLoadingCategories(true);

      const response = await fetch('/api/admin/categories', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        if (data && Array.isArray(data.categories)) {
          const categoriesWithColors = data.categories.map((cat: Category) => ({
            ...cat,
            color: cat.color || '#3b82f6'
          }));
          setCategories(categoriesWithColors);
        } else if (data && Array.isArray(data)) {
          const categoriesWithColors = data.map((cat: Category) => ({
            ...cat,
            color: cat.color || '#3b82f6'
          }));
          setCategories(categoriesWithColors);
        } else {
          console.error('Unerwartetes Datenformat:', data);
          setCategories([]);
        }
      } else {
        console.error('Fehler beim Laden der Kategorien:', response.statusText);

        setCategories([]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleAddCategory = async () => {
    try {
      if (!(await ensureSession())) return;

      if (!newCategory.name || !newCategory.slug) {
        setDialogMessage('Bitte geben Sie einen Namen für die Kategorie ein.');
        setErrorDialogOpen(true);
        return;
      }

      setIsLoadingCategories(true);

      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCategory)
      });

      if (response.ok) {
        await fetchCategories();

        setNewCategory({
          name: '',
          slug: '',
          description: '',
          color: '#3b82f6'
        });
        setUseCustomColor(false);

        setDialogMessage('Kategorie wurde erfolgreich erstellt!');
        setSuccessDialogOpen(true);
      } else {
        const errorData = await response.json();
        setDialogMessage(`Fehler beim Erstellen der Kategorie: ${errorData.error || response.statusText}`);
        setErrorDialogOpen(true);
        setIsLoadingCategories(false);
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Kategorie:', error);
      setDialogMessage('Fehler beim Erstellen der Kategorie. Bitte versuchen Sie es später erneut.');
      setErrorDialogOpen(true);
      setIsLoadingCategories(false);
    }
  };

  const handleUpdateCategory = async () => {
    try {
      if (!(await ensureSession())) return;

      if (!editingCategory) {
        return;
      }

      setIsLoadingCategories(true);

      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingCategory)
      });

      if (response.ok) {
        await fetchCategories();

        setEditingCategory(null);

        setDialogMessage('Kategorie wurde erfolgreich aktualisiert!');
        setSuccessDialogOpen(true);
      } else {
        const errorData = await response.json();
        setDialogMessage(`Fehler beim Aktualisieren der Kategorie: ${errorData.error || response.statusText}`);
        setErrorDialogOpen(true);
        setIsLoadingCategories(false);
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Kategorie:', error);
      setDialogMessage('Fehler beim Aktualisieren der Kategorie. Bitte versuchen Sie es später erneut.');
      setErrorDialogOpen(true);
      setIsLoadingCategories(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    setCategoryToDelete(categoryId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      if (!(await ensureSession())) return;

      setIsLoadingCategories(true);

      const response = await fetch(`/api/admin/categories/${categoryToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchCategories();

        setDialogMessage('Kategorie wurde erfolgreich gelöscht.');
        setSuccessDialogOpen(true);
      } else {
        const errorData = await response.json();
        setDialogMessage(`Fehler beim Löschen der Kategorie: ${errorData.error || response.statusText}`);
        setErrorDialogOpen(true);
        setIsLoadingCategories(false);
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Kategorie:', error);
      setDialogMessage('Fehler beim Löschen der Kategorie. Bitte versuchen Sie es später erneut.');
      setErrorDialogOpen(true);
      setIsLoadingCategories(false);
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const renderCategoryItem = (category: Category) => (
    <div key={category.id} className={styles.categoryItem}>
      <div className={styles.categoryInfo}>
        <span
          className={styles.categoryColorIndicator}
          style={{
            backgroundColor: category.color || '#3b82f6',
            display: 'block'
          }}
        ></span>
        <div>
          <h4 style={{ margin: '0 0 4px 0' }}>{category.name}</h4>
          <p className={styles.categorySlug}>{category.slug}</p>
          {category.description && <p className={styles.categoryDescription}>{category.description}</p>}
        </div>
      </div>
      <div className={styles.categoryActions}>
        <button
          className={styles.iconButton}
          title="Bearbeiten"
          onClick={() => setEditingCategory(category)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>

        <button
          className={styles.iconButton}
          style={{ color: '#ef4444' }}
          title="Löschen"
          onClick={() => handleDeleteCategory(category.id)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    fetchCategories().catch((err) => {
      console.error('Fehler beim Laden der Kategorien:', err);
    });
    return () => {
    };
  }, []);

  return (
    <div className={styles.adminSection}>
      <h2 className={styles.adminSectionTitle}>Kategorien verwalten</h2>
      <p>Hier können Sie Blog-Kategorien erstellen, bearbeiten und organisieren.</p>

      <div className={styles.categorySearchContainer} style={{ marginBottom: '20px' }}>
        <label className={styles.adminLabel} htmlFor="categorySearch">Kategorien durchsuchen</label>
        <div style={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
          <svg
            style={{
              position: 'absolute',
              left: '14px',
              top: 20,
              transform: 'translateY(-50%)',
              color: '#6B7280',
              zIndex: 1
            }}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            className={styles.adminInput}
            id="categorySearch"
            type="text"
            placeholder="Kategorienamen suchen..."
            style={{ paddingLeft: '42px', paddingRight: categorySearchQuery ? '42px' : '12px' }}
            value={categorySearchQuery}
            onChange={(e) => setCategorySearchQuery(e.target.value)}
          />
          {categorySearchQuery && (
            <button
              onClick={() => setCategorySearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6B7280'
              }}
              aria-label="Suche zurücksetzen"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>

      {deleteDialogOpen && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogContent}>
            <h3>Kategorie löschen</h3>
            <p>Sind Sie sicher, dass Sie diese Kategorie löschen möchten? Alle zugehörigen Blogbeiträge werden keine Kategorie mehr haben.</p>
            <div className={styles.dialogActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setCategoryToDelete(null);
                }}
              >
                Abbrechen
              </button>
              <button
                className={styles.deleteButton}
                onClick={confirmDeleteCategory}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {successDialogOpen && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogContent}>
            <div className={styles.dialogHeader}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <h3>Erfolg</h3>
            </div>
            <p>{dialogMessage}</p>
            <div className={styles.dialogActions}>
              <button
                className={styles.successButton}
                onClick={() => setSuccessDialogOpen(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {errorDialogOpen && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogContent}>
            <div className={styles.dialogHeader}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3>Fehler</h3>
            </div>
            <p>{dialogMessage}</p>
            <div className={styles.dialogActions}>
              <button
                className={styles.errorButton}
                onClick={() => setErrorDialogOpen(false)}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoadingCategories ? (
        <div className={styles.loadingState}>
          <p>Kategorien werden geladen...</p>
        </div>
      ) : (
        <div className={styles.categoriesWrapper}>
          <div className={styles.categoriesForm}>
            <h3>{editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie hinzufügen'}</h3>

            <div className={styles.formGroup}>
              <label htmlFor="categoryName">Name</label>
              <input
                id="categoryName"
                type="text"
                className={styles.adminInput}
                placeholder="Kategoriename"
                value={editingCategory ? editingCategory.name : newCategory.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

                  if (editingCategory) {
                    setEditingCategory({...editingCategory, name, slug});
                  } else {
                    setNewCategory({...newCategory, name, slug});
                  }
                }}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="categorySlug">Slug</label>
              <input
                id="categorySlug"
                type="text"
                className={styles.adminInput}
                placeholder="kategorie-slug"
                value={editingCategory ? editingCategory.slug : newCategory.slug}
                onChange={(e) => editingCategory
                  ? setEditingCategory({...editingCategory, slug: e.target.value})
                  : setNewCategory({...newCategory, slug: e.target.value})
                }
                disabled
              />
              <p className={styles.formHelp}>Der Slug wird automatisch aus dem Namen generiert und in der URL verwendet.</p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="categoryDescription">Beschreibung</label>
              <textarea
                id="categoryDescription"
                className={styles.adminTextarea}
                placeholder="Beschreibung der Kategorie"
                value={editingCategory ? editingCategory.description : newCategory.description}
                onChange={(e) => editingCategory
                  ? setEditingCategory({...editingCategory, description: e.target.value})
                  : setNewCategory({...newCategory, description: e.target.value})
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="categoryColor">Farbe</label>
              <div>
                <div className={styles.colorTypeSelector}>
                  <label className={styles.colorTypeOption}>
                    <input
                      type="radio"
                      id="predefinedColor"
                      name="colorType"
                      checked={!useCustomColor}
                      onChange={() => setUseCustomColor(false)}
                    />
                    Vordefinierte Farbe
                  </label>

                  <label className={styles.colorTypeOption}>
                    <input
                      type="radio"
                      id="customColor"
                      name="colorType"
                      checked={useCustomColor}
                      onChange={() => setUseCustomColor(true)}
                    />
                    Benutzerdefinierte Farbe
                  </label>
                </div>

                {!useCustomColor ? (
                  <div className={styles.colorOptions}>
                    {predefinedColors.map(color => (
                      <div
                        key={color.value}
                        onClick={() => {
                          if (editingCategory) {
                            setEditingCategory({...editingCategory, color: color.value});
                          } else {
                            setNewCategory({...newCategory, color: color.value});
                          }
                        }}
                        className={`${styles.colorOption} ${
                          (editingCategory ? editingCategory.color : newCategory.color) === color.value
                            ? styles.selected
                            : ''
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                ) : (
                  <input
                    id="categoryColor"
                    type="color"
                    className={styles.adminColorInput}
                    value={editingCategory ? editingCategory.color : newCategory.color}
                    onChange={(e) => editingCategory
                      ? setEditingCategory({...editingCategory, color: e.target.value})
                      : setNewCategory({...newCategory, color: e.target.value})
                    }
                  />
                )}
              </div>

              <div className={styles.colorPreview}>
                <div
                  className={styles.colorPreviewSwatch}
                  style={{
                    backgroundColor: editingCategory ? editingCategory.color : newCategory.color
                  }}
                ></div>
                <span className={styles.colorPreviewCode}>
                  {editingCategory ? editingCategory.color : newCategory.color}
                </span>
              </div>
            </div>

            <button
              className={styles.adminButton}
              onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
            >
              {editingCategory ? 'Kategorie aktualisieren' : 'Kategorie hinzufügen'}
            </button>

            {editingCategory && (
              <button
                className={styles.adminButton}
                onClick={() => setEditingCategory(null)}
                style={{ background: '#64748b', marginLeft: '10px' }}
              >
                Abbrechen
              </button>
            )}
          </div>

          <div className={styles.categoriesList}>
            <h3>Vorhandene Kategorien</h3>

            {!categories || categories.length === 0 ? (
              <p>Keine Kategorien vorhanden. Erstellen Sie Ihre erste Kategorie!</p>
            ) : (
              <>
                {categorySearchQuery ? (
                  categories.filter(category =>
                    category?.name?.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                    category?.slug?.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                    category?.description?.toLowerCase().includes(categorySearchQuery.toLowerCase())
                  ).length === 0 ? (
                    <p>Keine Kategorien gefunden, die "{categorySearchQuery}" enthalten.</p>
                  ) : (
                    categories
                      .filter(category =>
                        category?.name?.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                        category?.slug?.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                        category?.description?.toLowerCase().includes(categorySearchQuery.toLowerCase())
                      )
                      .map(category => renderCategoryItem(category))
                  )
                ) : (
                  categories.map(category => renderCategoryItem(category))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Kategorien;
