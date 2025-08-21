// --- Subkomponente für Slideshow-Modus ---
const GallerySlideshowPreview: React.FC<{images: string[], captions: string[], startIndex?: number, autoplay?: boolean, duration?: number, aspect?: string}> = ({images, captions, startIndex, autoplay, duration, aspect}) => {
  const [current, setCurrent] = React.useState(Number(startIndex) - 1 || 0);
  React.useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % images.length);
    }, (Number(duration) || 5) * 1000);
    return () => clearInterval(timer);
  }, [autoplay, duration, images.length]);
  if (!images || images.length === 0) {
    return <div style={{color:'#888',padding:24}}>Keine Bilder vorhanden.</div>;
  }
  return (
    <div style={{position:'relative',width:'100%',maxWidth:600,margin:'24px auto',background:'#f7fafd',borderRadius:12,boxShadow:'0 2px 12px 0 #e3e7ee',padding:16,display:'flex',flexDirection:'column',alignItems:'center'}}>
      <img
        src={images[current]}
        alt={captions[current] || `Bild ${current+1}`}
        style={{width:'100%',maxHeight:360,objectFit:'contain',borderRadius:8,background:'#eee',boxShadow:'0 1px 4px #0001', aspectRatio: aspect}}
      />
      {captions[current] && <div style={{marginTop:8,color:'#1976d2',fontWeight:500,fontSize:15,textAlign:'center'}}>{captions[current]}</div>}
      <div style={{marginTop:10,display:'flex',gap:6,justifyContent:'center'}}>
        {images.map((_,i)=>(
          <span key={i} style={{width:10,height:10,borderRadius:'50%',background:i===current?'#1976d2':'#cfd8dc',display:'inline-block',cursor:'pointer'}} onClick={()=>setCurrent(i)} />
        ))}
      </div>
    </div>
  );
};

// --- Subkomponente für Fullscreen-Modus ---
const GalleryFullscreenPreview: React.FC<{images: string[], captions: string[], startIndex?: number, aspect?: string}> = ({images, captions, startIndex, aspect}) => {
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState(Number(startIndex) - 1 || 0);
  if (!images || images.length === 0) {
    return <div style={{color:'#888',padding:24}}>Keine Bilder vorhanden.</div>;
  }
  return (
    <div style={{position:'relative',width:'100%',maxWidth:600,margin:'24px auto',background:'#f7fafd',borderRadius:12,boxShadow:'0 2px 12px 0 #e3e7ee',padding:16,display:'flex',flexDirection:'column',alignItems:'center'}}>
      <img
        src={images[current]}
        alt={captions[current] || `Bild ${current+1}`}
        style={{width:'100%',maxHeight:360,objectFit:'contain',borderRadius:8,background:'#eee',boxShadow:'0 1px 4px #0001',cursor:'pointer', aspectRatio: aspect}}
        onClick={()=>setOpen(true)}
      />
      {captions[current] && <div style={{marginTop:8,color:'#1976d2',fontWeight:500,fontSize:15,textAlign:'center'}}>{captions[current]}</div>}
      <div style={{marginTop:10,display:'flex',gap:6,justifyContent:'center'}}>
        {images.map((_,i)=>(
          <span key={i} style={{width:10,height:10,borderRadius:'50%',background:i===current?'#1976d2':'#cfd8dc',display:'inline-block',cursor:'pointer'}} onClick={()=>setCurrent(i)} />
        ))}
      </div>
      {open && (
        <div style={{position:'fixed',zIndex:1000,left:0,top:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.95)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setOpen(false)}>
          <img
            src={images[current]}
            alt={captions[current] || `Bild ${current+1}`}
            style={{maxWidth:'90vw',maxHeight:'80vh',borderRadius:12,boxShadow:'0 4px 24px #0008',background:'#fff'}}
          />
          {captions[current] && (
            <div style={{ position: 'fixed', left: 0, right: 0, bottom: 32, color: '#fff', fontSize: 18, textAlign: 'center', textShadow: '0 2px 8px #000' }}>{captions[current]}</div>
          )}
          <button onClick={e => {e.stopPropagation(); setOpen(false);}} style={{position:'fixed',top:32,right:32,fontSize:32,background:'none',border:'none',color:'#fff',cursor:'pointer',zIndex:1100}} aria-label="Schließen">&times;</button>
        </div>
      )}
    </div>
  );
};
// Props-Typ für die Preview-Komponente
type GalleryBlockPreviewProps = {
  data: {
    images?: string[];
    mode?: string;
    columns?: number;
    gap?: number;
    captions?: string[];
    autoplay?: boolean;
    duration?: number;
    startIndex?: number;
    lightbox?: boolean;
    aspect?: string;
    [key: string]: any;
  };
};





import React from "react";

// --- Subkomponenten für die Modi mit eigenen Hooks ---
const GallerySliderPreview: React.FC<{images: string[], captions: string[], startIndex?: number, lightbox?: boolean, autoplay?: boolean, duration?: number, aspect?: string}> = ({images, captions, startIndex, lightbox, autoplay, duration, aspect}) => {
  const [current, setCurrent] = React.useState(Number(startIndex) - 1 || 0);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % images.length);
    }, (Number(duration) || 5) * 1000);
    return () => clearInterval(timer);
  }, [autoplay, duration, images.length]);
  if (!images || images.length === 0) {
    return <div style={{color:'#888',padding:24}}>Keine Bilder vorhanden.</div>;
  }
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 600, margin: '24px auto', background: '#f7fafd', borderRadius: 12, boxShadow: '0 2px 12px 0 #e3e7ee', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <img
        src={images[current]}
        alt={captions[current] || `Bild ${current+1}`}
        style={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 8, background: '#eee', boxShadow: '0 1px 4px #0001', cursor: lightbox ? 'pointer' : undefined, aspectRatio: aspect }}
        onClick={lightbox ? () => setOpen(true) : undefined}
      />
      {captions[current] && <div style={{ marginTop: 8, color: '#1976d2', fontWeight: 500, fontSize: 15, textAlign: 'center' }}>{captions[current]}</div>}
      <div style={{ marginTop: 10, display: 'flex', gap: 6, justifyContent: 'center' }}>
        {images.map((_, i) => (
          <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i === current ? '#1976d2' : '#cfd8dc', display: 'inline-block', cursor: 'pointer' }} onClick={() => setCurrent(i)} />
        ))}
      </div>
      {lightbox && open && (
        <div style={{position:'fixed',zIndex:1000,left:0,top:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.95)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setOpen(false)}>
          <img
            src={images[current]}
            alt={captions[current] || `Bild ${current+1}`}
            style={{maxWidth:'90vw',maxHeight:'80vh',borderRadius:12,boxShadow:'0 4px 24px #0008',background:'#fff', aspectRatio: aspect}}
          />
          {captions[current] && (
            <div style={{ position: 'fixed', left: 0, right: 0, bottom: 32, color: '#fff', fontSize: 18, textAlign: 'center', textShadow: '0 2px 8px #000' }}>{captions[current]}</div>
          )}
          <button onClick={e => {e.stopPropagation(); setOpen(false);}} style={{position:'fixed',top:32,right:32,fontSize:32,background:'none',border:'none',color:'#fff',cursor:'pointer',zIndex:1100}} aria-label="Schließen">&times;</button>
        </div>
      )}
    </div>
  );
};

// --- Verschobene Subkomponenten ---
const GalleryMasonryPreview: React.FC<{images: string[], captions: string[], columns?: number, gap?: number, lightbox?: boolean, aspect?: string}> = ({images, captions, columns, gap, lightbox, aspect}) => {
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const colCount = Math.max(2, Math.min(6, Number(columns) || 3));
  const gapPx = Number(gap) || 8;
  return (
    <div style={{
      columnCount: colCount,
      columnGap: gapPx,
      margin: '16px 0',
      background: '#f7fafd',
      borderRadius: 12,
      boxShadow: '0 2px 12px 0 #e3e7ee',
      padding: gapPx
    }}>
      {images.map((url: string, i: number) => (
        <div key={i} style={{
          breakInside: 'avoid',
          marginBottom: gapPx,
          borderRadius: 8,
          overflow: 'hidden',
          background: '#eee',
          boxShadow: '0 1px 4px #0001',
          position: 'relative',
          cursor: lightbox ? 'pointer' : undefined
        }}
          onClick={lightbox ? () => { setCurrent(i); setOpen(true); } : undefined}
        >
          <img
            src={url}
            alt={captions[i] || `Bild ${i + 1}`}
            style={{ width: '100%', display: 'block', borderRadius: 8, aspectRatio: aspect }}
          />
          {captions[i] && (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 13, padding: '2px 6px', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>{captions[i]}</div>
          )}
        </div>
      ))}
      {lightbox && open && (
        <div style={{position:'fixed',zIndex:1000,left:0,top:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.95)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setOpen(false)}>
          <img
            src={images[current]}
            alt={captions[current] || `Bild ${current+1}`}
            style={{maxWidth:'90vw',maxHeight:'80vh',borderRadius:12,boxShadow:'0 4px 24px #0008',background:'#fff', aspectRatio: aspect}}
          />
          {captions[current] && (
            <div style={{ position: 'fixed', left: 0, right: 0, bottom: 32, color: '#fff', fontSize: 18, textAlign: 'center', textShadow: '0 2px 8px #000' }}>{captions[current]}</div>
          )}
          <button onClick={e => {e.stopPropagation(); setOpen(false);}} style={{position:'fixed',top:32,right:32,fontSize:32,background:'none',border:'none',color:'#fff',cursor:'pointer',zIndex:1100}} aria-label="Schließen">&times;</button>
        </div>
      )}
    </div>
  );
};

const GalleryCollagePreview: React.FC<{images: string[], captions: string[], lightbox?: boolean, aspect?: string}> = ({images, captions, lightbox, aspect}) => {
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignItems: 'flex-end',
      margin: '16px 0', background: '#f7fafd', borderRadius: 12, boxShadow: '0 2px 12px 0 #e3e7ee', padding: 12
    }}>
      {images.map((url: string, i: number) => {
        // Zufällige Größe für Collage-Effekt
        const w = 120 + (i % 3) * 40;
        const h = 80 + ((i + 1) % 3) * 30;
        return (
          <div key={i} style={{ width: w, height: h, borderRadius: 8, overflow: 'hidden', background: '#eee', position: 'relative', boxShadow: '0 1px 4px #0001', cursor: lightbox ? 'pointer' : undefined }}
            onClick={lightbox ? () => { setCurrent(i); setOpen(true); } : undefined}
          >
            <img src={url} alt={captions[i] || `Bild ${i + 1}`} style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: 8, aspectRatio: aspect }} />
            {captions[i] && (
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 13, padding: '2px 6px', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>{captions[i]}</div>
            )}
          </div>
        );
      })}
      {lightbox && open && (
        <div style={{position:'fixed',zIndex:1000,left:0,top:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.95)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setOpen(false)}>
          <img
            src={images[current]}
            alt={captions[current] || `Bild ${current+1}`}
            style={{width:'100%',height:'auto',objectFit:'cover',borderRadius:12,boxShadow:'0 4px 24px #0008',background:'#fff', aspectRatio: aspect}}
          />
          {captions[current] && (
            <div style={{ position: 'fixed', left: 0, right: 0, bottom: 32, color: '#fff', fontSize: 18, textAlign: 'center', textShadow: '0 2px 8px #000' }}>{captions[current]}</div>
          )}
          <button onClick={e => {e.stopPropagation(); setOpen(false);}} style={{position:'fixed',top:32,right:32,fontSize:32,background:'none',border:'none',color:'#fff',cursor:'pointer',zIndex:1100}} aria-label="Schließen">&times;</button>
        </div>
      )}
    </div>
  );
};

const GalleryThumbnailsPreview: React.FC<{images: string[], captions: string[], lightbox?: boolean, aspect?: string}> = ({images, captions, lightbox, aspect}) => {
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
      margin: '16px 0', background: '#f7fafd', borderRadius: 12, boxShadow: '0 2px 12px 0 #e3e7ee', padding: 12
    }}>
      {images.map((url: string, i: number) => (
        <div key={i} style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', background: '#eee', position: 'relative', boxShadow: '0 1px 4px #0001', cursor: lightbox ? 'pointer' : undefined }}
          onClick={lightbox ? () => { setCurrent(i); setOpen(true); } : undefined}
        >
          <img src={url} alt={captions[i] || `Bild ${i + 1}`} style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: 8, aspectRatio: aspect }} />
          {captions[i] && (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11, padding: '1px 4px', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>{captions[i]}</div>
          )}
        </div>
      ))}
      {lightbox && open && (
        <div style={{position:'fixed',zIndex:1000,left:0,top:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.95)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setOpen(false)}>
          <img
            src={images[current]}
            alt={captions[current] || `Bild ${current+1}`}
            style={{width:'100%',height:'auto',objectFit:'cover',borderRadius:12,boxShadow:'0 4px 24px #0008',background:'#fff', aspectRatio: aspect}}
          />
          {captions[current] && (
            <div style={{ position: 'fixed', left: 0, right: 0, bottom: 32, color: '#fff', fontSize: 18, textAlign: 'center', textShadow: '0 2px 8px #000' }}>{captions[current]}</div>
          )}
          <button onClick={e => {e.stopPropagation(); setOpen(false);}} style={{position:'fixed',top:32,right:32,fontSize:32,background:'none',border:'none',color:'#fff',cursor:'pointer',zIndex:1100}} aria-label="Schließen">&times;</button>
        </div>
      )}
    </div>
  );
};


const GalleryLightboxPreview: React.FC<{images: string[], captions: string[], aspect?: string}> = ({images, captions, aspect}) => {
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  if (!images || images.length === 0) {
    return <div style={{color:'#888',padding:24}}>Keine Bilder vorhanden.</div>;
  }
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:12,justifyContent:'center',margin:'16px 0',background:'#f7fafd',borderRadius:12,boxShadow:'0 2px 12px 0 #e3e7ee',padding:16}}>
      {images.map((url, i) => (
        <div key={i} style={{width:120,height:80,margin:4,borderRadius:8,overflow:'hidden',background:'#eee',boxShadow:'0 1px 4px #0001',position:'relative',cursor:'pointer'}}
          onClick={()=>{setCurrent(i);setOpen(true);}}>
          <img src={url} alt={captions[i] || `Bild ${i+1}`} style={{width:'100%',height:'auto',objectFit:'cover',borderRadius:8, aspectRatio: aspect}} />
          {captions[i] && (
            <div style={{position:'absolute',left:0,right:0,bottom:0,background:'rgba(0,0,0,0.55)',color:'#fff',fontSize:12,padding:'2px 6px',borderBottomLeftRadius:8,borderBottomRightRadius:8}}>{captions[i]}</div>
          )}
        </div>
      ))}
      {open && (
        <div style={{position:'fixed',zIndex:2000,left:0,top:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.97)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setOpen(false)}>
          <img
            src={images[current]}
            alt={captions[current] || `Bild ${current+1}`}
            style={{width:'100%',height:'auto',objectFit:'cover',borderRadius:12,boxShadow:'0 4px 24px #0008',background:'#fff', aspectRatio: aspect}}
          />
          {captions[current] && (
            <div style={{position:'fixed',left:0,right:0,bottom:32,color:'#fff',fontSize:18,textAlign:'center',textShadow:'0 2px 8px #000'}}>{captions[current]}</div>
          )}
          <button type="button" onClick={e=>{e.stopPropagation();setOpen(false);}} style={{position:'fixed',top:32,right:32,fontSize:32,background:'none',border:'none',color:'#fff',cursor:'pointer',zIndex:2100}} aria-label="Schließen">&times;</button>
          {/* Navigation */}
          {images.length>1 && <>
            <button type="button" onClick={e=>{e.stopPropagation();setCurrent((current-1+images.length)%images.length);}} style={{position:'fixed',left:32,top:'50%',transform:'translateY(-50%)',fontSize:48,background:'none',border:'none',color:'#fff',cursor:'pointer',zIndex:2100}} aria-label="Vorheriges Bild">&#8592;</button>
            <button type="button" onClick={e=>{e.stopPropagation();setCurrent((current+1)%images.length);}} style={{position:'fixed',right:32,top:'50%',transform:'translateY(-50%)',fontSize:48,background:'none',border:'none',color:'#fff',cursor:'pointer',zIndex:2100}} aria-label="Nächstes Bild">&#8594;</button>
          </>}
        </div>
      )}
    </div>
  );
};






const UnmemoizedGalleryBlockPreview: React.FC<GalleryBlockPreviewProps> = ({ data }) => {
  
  let galleryData = {
    images: [],
    mode: "grid",
    columns: 3,
    gap: 8,
    captions: [],
    autoplay: false,
    duration: 5,
    startIndex: 1,
    lightbox: true,
    aspect: "original"
  };
  try {
    galleryData = { ...galleryData, ...data, mode: (data.mode || "grid") };

  } catch (error) {
    console.error("Error processing gallery data in preview:", error);
  }



  const mode = (galleryData.mode || "grid").toLowerCase();
  if (mode === "grid" || !mode) {
    const colCount = Math.max(1, Math.min(6, Number(galleryData.columns) || 3));
    const gap = Number(galleryData.gap) || 8;
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
        gap,
        margin: '16px 0',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#f7fafd',
        boxShadow: '0 2px 12px 0 #e3e7ee',
        padding: gap
      }}>
        {galleryData.images.map((url: string, i: number) => {
          let aspectRatio: string | undefined = undefined;
          switch (galleryData.aspect) {
            case "square": aspectRatio = "1 / 1"; break;
            case "16:9": aspectRatio = "16 / 9"; break;
            case "4:3": aspectRatio = "4 / 3"; break;
            default: aspectRatio = undefined;
          }
          return (
            <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#eee' }}>
              <img
                src={url}
                alt={galleryData.captions[i] || `Bild ${i + 1}`}
                style={{ width: '100%', aspectRatio, objectFit: 'cover', borderRadius: 8, boxShadow: '0 1px 4px #0001' }}
              />
              {galleryData.captions[i] && (
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 14, padding: '4px 8px', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>{galleryData.captions[i]}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Slider-Modus mit Autoplay und Lightbox
  // Hilfsfunktion für aspect-ratio
  const getAspectRatio = (aspect: string) => {
    switch (aspect) {
      case "square": return "1 / 1";
      case "16:9": return "16 / 9";
      case "4:3": return "4 / 3";
      default: return undefined;
    }
  };

  if (mode === "slider") {
    return <GallerySliderPreview images={galleryData.images} captions={galleryData.captions || []} startIndex={galleryData.startIndex} lightbox={galleryData.lightbox} autoplay={galleryData.autoplay} duration={galleryData.duration} aspect={getAspectRatio(galleryData.aspect)} />;
  }

  if (mode === "lightbox") {
    return <GalleryLightboxPreview images={galleryData.images} captions={galleryData.captions || []} aspect={getAspectRatio(galleryData.aspect)} />;
  }

  if (mode === "masonry") {
    return <GalleryMasonryPreview images={galleryData.images} captions={galleryData.captions || []} columns={galleryData.columns} gap={galleryData.gap} lightbox={galleryData.lightbox} aspect={getAspectRatio(galleryData.aspect)} />;
  }

  if (mode === "collage") {
    return <GalleryCollagePreview images={galleryData.images} captions={galleryData.captions || []} lightbox={galleryData.lightbox} aspect={getAspectRatio(galleryData.aspect)} />;
  }

  if (mode === "thumbnails") {
    return <GalleryThumbnailsPreview images={galleryData.images} captions={galleryData.captions || []} lightbox={galleryData.lightbox} aspect={getAspectRatio(galleryData.aspect)} />;
  }

  if (mode === "slideshow") {
    return <GallerySlideshowPreview images={galleryData.images} captions={galleryData.captions || []} startIndex={galleryData.startIndex} autoplay={galleryData.autoplay} duration={galleryData.duration} aspect={getAspectRatio(galleryData.aspect)} />;
  }

  if (mode === "fullscreen") {
    return <GalleryFullscreenPreview images={galleryData.images} captions={galleryData.captions || []} startIndex={galleryData.startIndex} aspect={getAspectRatio(galleryData.aspect)} />;
  }
};

const GalleryBlockPreview = React.memo(UnmemoizedGalleryBlockPreview);
export default GalleryBlockPreview;
