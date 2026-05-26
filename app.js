/**
 * Hayal Kütüphanesi — app.js (Tam Güncel Sürüm)
 */

const PAGES = {
  0: { label: 'Sayfa 0', audio: './audio/sayfa0.mp3' },
  1: { label: 'Sayfa 5', audio: './audio/sayfa5.mp3' },
  2: { label: 'Sayfa 14', audio: './audio/sayfa14.mp3' },
  3: { label: 'Sayfa 15', audio: './audio/sayfa15.mp3' }
};

let currentAudio = null;
let indicatorTimer = null;
let arStarted = false;

// KONTROL AKIŞ DEĞİŞKENLERİ
let isMuted = false;
let modelsVisible = true;

// PINCH TO ZOOM TABAN ÖLÇEKLERİ
const baseScales = { 'target-0': 4, 'target-1': 4, 'target-2': 0.045, 'target-3': 4 };
let scaleModifiers = { 'target-0': 1, 'target-1': 1, 'target-2': 1, 'target-3': 1 };
let startDistance = 0;

function playAudio(src) {
  stopAudio();
  if (!src) return;
  currentAudio = new Audio(src);
  currentAudio.muted = isMuted; 
  currentAudio.play().catch(err => console.warn('Ses oynatılamadı:', err));
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

function showIndicator(label) {
  const el = document.getElementById('page-indicator');
  if (!el) return;
  el.textContent = label + ' algılandı';
  el.classList.add('visible');
  clearTimeout(indicatorTimer);
  indicatorTimer = setTimeout(() => el.classList.remove('visible'), 3000);
}

function hideIndicator() {
  const el = document.getElementById('page-indicator');
  if (el) el.classList.remove('visible');
  clearTimeout(indicatorTimer);
}

function bindTargets(scene) {
  Object.entries(PAGES).forEach(([indexStr, page]) => {
    const idx = parseInt(indexStr, 10);
    const entity = document.getElementById('target-' + idx);
    if (!entity) return;

    entity.addEventListener('targetFound', () => {
      console.log('Bulundu:', page.label);
      showIndicator(page.label);
      playAudio(page.audio);
    });

    entity.addEventListener('targetLost', () => {
      console.log('Kayboldu:', page.label);
      hideIndicator();
      stopAudio();
    });
  });
}

function startMindAR() {
  if (arStarted) return;
  arStarted = true;
  const scene = document.getElementById('arScene');

  function tryStart() {
    const mindarSystem = scene.systems['mindar-image-system'];
    if (mindarSystem) {
      bindTargets(scene);
      mindarSystem.start();
      document.getElementById('dashboard').style.display = 'none';
      document.getElementById('ar-ui').classList.add('active');
    } else {
      setTimeout(tryStart, 300);
    }
  }

  if (scene.hasLoaded) {
    tryStart();
  } else {
    scene.addEventListener('loaded', tryStart);
  }
}

// GÜNCELLEME: BALONCUKLARIN KART MERKEZİNDEN KUSURSUZCA ETRAFA SAÇILMASINI SAĞLAYAN MOTOR
function triggerBubbleBurst(e) {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  
  // Baloncukların kartın tam göbeğinden dairesel yayılması kilitlendi
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  
  for (let i = 0; i < 25; i++) {
    const b = document.createElement('div');
    b.className = 'burst-bubble';
    
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 120; 
    
    const tx = Math.cos(angle) * distance + 'px';
    const ty = Math.sin(angle) * distance + 'px';
    const scale = 0.5 + Math.random() * 1.3;
    const size = 10 + Math.random() * 16 + 'px';
    
    b.style.width = size;
    b.style.height = size;
    b.style.left = x + 'px';
    b.style.top = y + 'px';
    
    b.style.setProperty('--tx', tx);
    b.style.setProperty('--ty', ty);
    b.style.setProperty('--scale', scale);
    
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 700);
  }
}

// UI VE HAREKET OLAYLARI
document.addEventListener('DOMContentLoaded', () => {
  const temizDenizCard = document.getElementById('temizDenizCard');
  const searchInput = document.getElementById('searchInput');
  const bookCards = document.querySelectorAll('.book-card');
  
  const finishBtn = document.getElementById('finishBtn'); 
  const toggleModelBtn = document.getElementById('toggleModelBtn');
  const toggleAudioBtn = document.getElementById('toggleAudioBtn');

  // KESİN DÜZELTME: Giriş sayfasındaki kitap kapaklarına fare geldiğinde (hover) tetiklenir
  bookCards.forEach(card => {
    card.addEventListener('mouseenter', (e) => {
      triggerBubbleBurst(e);
    });
  });

  // 1. Kütüphaneden Kitaba Giriş (Tıklama efekti)
  if (temizDenizCard) {
    temizDenizCard.addEventListener('click', (e) => {
      triggerBubbleBurst(e);
      
      const titleEl = temizDenizCard.querySelector('.book-title');
      if (titleEl) titleEl.textContent = "Açılıyor...";
      temizDenizCard.style.opacity = "0.7";
      temizDenizCard.style.pointerEvents = "none";
      
      setTimeout(() => {
        startMindAR();
      }, 650);
    });
  }

  // 2. Canlı Kitap Arama Motoru
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      bookCards.forEach(card => {
        const bookTitle = card.getAttribute('data-title') || "";
        card.style.display = bookTitle.includes(query) ? "flex" : "none";
      });
    });
  }

  // 3. SAĞ PANEL: Model Aç / Kapat Fonksiyonu
  if (toggleModelBtn) {
    toggleModelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      modelsVisible = !modelsVisible;
      document.querySelectorAll('a-gltf-model').forEach(model => {
        model.setAttribute('visible', modelsVisible);
      });
      toggleModelBtn.querySelector('.icon').textContent = modelsVisible ? '👁️' : '🙈';
      toggleModelBtn.querySelector('.text').textContent = modelsVisible ? 'Görünüm' : 'Gizle';
    });
  }

  // 4. SAĞ PANEL: Ses Aç / Kapat Fonksiyonu
  if (toggleAudioBtn) {
    toggleAudioBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isMuted = !isMuted;
      if (currentAudio) {
        currentAudio.muted = isMuted;
      }
      toggleAudioBtn.querySelector('.icon').textContent = isMuted ? '🔇' : '🔊';
      toggleAudioBtn.querySelector('.text').textContent = isMuted ? 'Ses' : 'Kıs';
    });
  }

  // 5. PINCH TO ZOOM
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      startDistance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
    }
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && startDistance > 0) {
      const currentDistance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const factor = currentDistance / startDistance;
      startDistance = currentDistance;

      Object.keys(scaleModifiers).forEach(id => {
        let newModifier = scaleModifiers[id] * factor;
        if (newModifier >= 0.4 && newModifier <= 2.5) {
          scaleModifiers[id] = newModifier;
          const model = document.querySelector(`#${id} a-gltf-model`);
          if (model) {
            let base = baseScales[id];
            let finalScale = base * newModifier;
            model.setAttribute('scale', `${finalScale} ${finalScale} ${finalScale}`);
          }
        }
      });
    }
  });

  window.addEventListener('touchend', () => {
    startDistance = 0;
  });

  // 6. KESİN ÇIKIŞ FONKSİYONU (Kamera Ekranı Orijinal Bırakıldı)
  if (finishBtn) {
    finishBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); 
      
      stopAudio();
      hideIndicator();
      document.getElementById('ar-ui').classList.remove('active');
      
      if (temizDenizCard) {
        const titleEl = temizDenizCard.querySelector('.book-title');
        if (titleEl) titleEl.textContent = "Temiz Deniz";
        temizDenizCard.style.opacity = "1";
        temizDenizCard.style.pointerEvents = "auto";
      }
      
      document.getElementById('dashboard').style.display = 'flex';
      
      const scene = document.getElementById('arScene');
      if (scene && scene.systems['mindar-image-system']) {
        scene.systems['mindar-image-system'].stop();
      }
      arStarted = false;
    });
  }
});

// RESİZE MOTORU
function forceFixARResize() {
  const scene = document.getElementById('arScene');
  if (scene) {
    scene.resize();
    const cameraEl = document.querySelector('a-camera');
    if (cameraEl && cameraEl.components.camera) {
      const threeCamera = cameraEl.components.camera.camera;
      if (threeCamera) {
        threeCamera.aspect = window.innerWidth / window.innerHeight;
        threeCamera.updateProjectionMatrix();
      }
    }
  }
}

window.addEventListener("resize", forceFixARResize);
window.addEventListener("orientationchange", () => {
  setTimeout(forceFixARResize, 350); 
});