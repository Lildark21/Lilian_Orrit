/* ===== CONFIGURATION TAILWIND ===== */
tailwind.config = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite alternate',
        float: 'float 6s ease-in-out infinite',
        typing: 'typing 3.5s steps(30, end)',
        glitch: 'glitch 0.3s infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
};

/* ===== VARIABLES GLOBALES ===== */
let scene, camera, renderer, galaxy;
let mouseX = 0;
let mouseY = 0;
let lastScrollTop = 0;

/* ===== FONCTIONS UTILITAIRES ===== */

/**
 * Délai d'attente
 * @param {number} ms - Millisecondes à attendre
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Détection mobile
 */
const isMobile = () => window.innerWidth <= 768;

/**
 * Throttle function pour optimiser les performances
 */
const throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/* ===== LOADING ANIMATION ===== */

/**
 * Gestion de l'écran de chargement
 */
const initLoadingScreen = () => {
  window.addEventListener('load', async () => {
    const loading = document.getElementById('loading');

    // Attendre que tout soit bien chargé
    await delay(1000);

    // Démarrer l'animation de fade out
    loading.classList.add('fade-out');

    // Supprimer l'élément après l'animation
    setTimeout(() => {
      loading.style.display = 'none';
      // Démarrer les animations d'entrée
      initEntranceAnimations();
    }, 500);
  });
};

/**
 * Animations d'entrée des éléments
 */
const initEntranceAnimations = () => {
  // Animer les éléments principaux avec un délai progressif
  const elementsToAnimate = [
    '.glitch',
    '.animate-float',
    '.typing-text',
    '.skill-tag',
  ];

  elementsToAnimate.forEach((selector, index) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, elementIndex) => {
      setTimeout(() => {
        element.style.opacity = '1';
        element.style.animation =
          element.style.animation || 'fadeIn 0.6s ease-out';
      }, index * 200 + elementIndex * 100);
    });
  });
};

/* ===== INTERSECTION OBSERVER ===== */

/**
 * Configuration de l'Intersection Observer pour les animations au scroll
 */
const initScrollAnimations = () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Ajouter l'animation avec un délai aléatoire pour un effet plus naturel
        const delay = Math.random() * 300;
        setTimeout(() => {
          entry.target.style.animationDelay = '0s';
          entry.target.classList.add('animate-fade-in');

          // Ajouter des classes spécifiques selon le type d'élément
          if (entry.target.classList.contains('skill-card')) {
            entry.target.style.animation = 'slideUp 0.8s ease-out forwards';
          }
          if (entry.target.classList.contains('project-card')) {
            entry.target.style.animation = 'fadeIn 1s ease-out forwards';
          }
        }, delay);

        // Arrêter d'observer cet élément une fois animé
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observer tous les éléments avec animations
  const elementsToObserve = document.querySelectorAll(`
        section > div, 
        .skill-card, 
        .project-card, 
        .stage-card,
        .timeline-item,
        h2, h3
    `);

  elementsToObserve.forEach((el) => {
    observer.observe(el);
  });
};

/* ===== NAVIGATION ===== */

/**
 * Gestion de la navigation avec scroll
 */
const initNavigation = () => {
  const header = document.querySelector('header');

  // Effet de scroll sur la navigation
  const handleScroll = throttle(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > 100) {
      header.style.transform = 'translateY(-100%)';
    } else {
      header.style.transform = 'translateY(0)';
    }
    lastScrollTop = scrollTop;
  }, 100);

  window.addEventListener('scroll', handleScroll);

  // Smooth scroll pour les liens de navigation
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();

      const targetId = this.getAttribute('href');
      const target = document.querySelector(targetId);

      if (target) {
        const offsetTop = target.offsetTop - 80; // Compensation pour la nav fixe

        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth',
        });

        // Ajouter un effet visual feedback
        anchor.style.transform = 'scale(0.95)';
        setTimeout(() => {
          anchor.style.transform = 'scale(1)';
        }, 150);
      }
    });
  });

  // Highlighting actif de la navigation
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('nav a[href^="#"]');

  window.addEventListener(
    'scroll',
    throttle(() => {
      let current = '';

      sections.forEach((section) => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.clientHeight;

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          current = section.getAttribute('id');
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove('text-cyan-400');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('text-cyan-400');
        }
      });
    }, 100)
  );
};

/* ===== THREE.JS ANIMATION ===== */

/**
 * Initialisation de Three.js
 */
const initThreeJS = () => {
  // Configuration de base
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg-animation'),
    alpha: true,
    antialias: !isMobile(), // Désactiver l'antialias sur mobile pour les performances
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limiter le pixel ratio
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Position de la caméra
  camera.position.setZ(30);
  camera.position.setY(5);

  // Créer la galaxie
  galaxy = createGalaxy();
  scene.add(galaxy);

  // Ajouter des étoiles en arrière-plan
  createStars();

  // Démarrer l'animation
  animate();

  // Gestion du redimensionnement
  window.addEventListener('resize', handleResize);

  // Effet parallaxe avec la souris
  document.addEventListener('mousemove', handleMouseMove);
};

/**
 * Création de la galaxie avec Three.js
 */
const createGalaxy = () => {
  const parameters = {
    count: isMobile() ? 15000 : 30000, // Moins de particules sur mobile
    size: 0.01,
    radius: 8,
    branches: 4,
    spin: 1,
    randomness: 0.3,
    randomnessPower: 2,
    insideColor: '#00d4ff',
    outsideColor: '#1a1a2e',
  };

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(parameters.count * 3);
  const colors = new Float32Array(parameters.count * 3);

  const colorInside = new THREE.Color(parameters.insideColor);
  const colorOutside = new THREE.Color(parameters.outsideColor);

  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3;
    const radius = Math.random() * parameters.radius;
    const spinAngle = radius * parameters.spin;
    const branchAngle =
      ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

    const randomX =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1);
    const randomY =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1);
    const randomZ =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1);

    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
    positions[i3 + 1] = randomY * 0.3;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

    const mixedColor = colorInside.clone();
    mixedColor.lerp(colorOutside, radius / parameters.radius);

    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: parameters.size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  return new THREE.Points(geometry, material);
};

/**
 * Création des étoiles en arrière-plan
 */
const createStars = () => {
  const starCount = isMobile() ? 50 : 100;

  for (let i = 0; i < starCount; i++) {
    const geometry = new THREE.SphereGeometry(0.05, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const star = new THREE.Mesh(geometry, material);

    const [x, y, z] = Array(3)
      .fill()
      .map(() => THREE.MathUtils.randFloatSpread(80));
    star.position.set(x, y, z);
    scene.add(star);
  }
};

/**
 * Gestion du redimensionnement
 */
const handleResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

/**
 * Gestion du mouvement de la souris pour l'effet parallaxe
 */
const handleMouseMove = throttle((event) => {
  if (isMobile()) return; // Désactiver sur mobile

  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = (event.clientY / window.innerHeight) * 2 - 1;

  // Animation fluide avec GSAP
  if (typeof gsap !== 'undefined' && galaxy) {
    gsap.to(galaxy.rotation, {
      y: mouseX * 0.3,
      x: -mouseY * 0.2,
      duration: 2,
      ease: 'power2.out',
    });
  }
}, 50);

/**
 * Boucle d'animation Three.js
 */
const animate = () => {
  requestAnimationFrame(animate);

  if (galaxy) {
    // Rotation continue de la galaxie
    galaxy.rotation.y += 0.002;
    galaxy.rotation.z += 0.001;
  }

  // Mouvement subtil de caméra
  const time = Date.now() * 0.0003;
  camera.position.x = Math.sin(time) * 2;
  camera.position.y = 5 + Math.cos(time * 0.5) * 1;

  camera.lookAt(scene.position);
  renderer.render(scene, camera);
};

/* ===== EFFETS VISUELS SUPPLÉMENTAIRES ===== */

/**
 * Effet de particules au clic
 */
const initClickEffects = () => {
  document.addEventListener('click', (e) => {
    createClickParticles(e.clientX, e.clientY);
  });
};

const createClickParticles = (x, y) => {
  for (let i = 0; i < 6; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: #06b6d4;
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            left: ${x}px;
            top: ${y}px;
        `;

    document.body.appendChild(particle);

    // Animation des particules
    const angle = (i / 6) * Math.PI * 2;
    const velocity = 100;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;

    let posX = x;
    let posY = y;
    let opacity = 1;

    const animateParticle = () => {
      posX += vx * 0.02;
      posY += vy * 0.02;
      opacity -= 0.02;

      particle.style.left = posX + 'px';
      particle.style.top = posY + 'px';
      particle.style.opacity = opacity;

      if (opacity > 0) {
        requestAnimationFrame(animateParticle);
      } else {
        document.body.removeChild(particle);
      }
    };

    animateParticle();
  }
};

/**
 * Effet de typing progressif
 */
const initTypingEffect = () => {
  const typingElements = document.querySelectorAll('.typing-text p');

  typingElements.forEach((element, index) => {
    const text = element.textContent;
    element.textContent = '';

    setTimeout(() => {
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        element.textContent += text[charIndex];
        charIndex++;

        if (charIndex >= text.length) {
          clearInterval(typeInterval);
          // Supprimer la bordure clignotante après la fin
          setTimeout(() => {
            element.style.borderRight = 'none';
          }, 1000);
        }
      }, 50);
    }, index * 1000);
  });
};

/**
 * Animation des compteurs
 */
const initCounterAnimations = () => {
  const counters = document.querySelectorAll('[data-count]');

  const animateCounter = (counter) => {
    const target = parseInt(counter.getAttribute('data-count'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
      current += step;
      if (current < target) {
        counter.textContent = Math.floor(current);
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target;
      }
    };

    updateCounter();
  };

  // Observer pour déclencher l'animation quand visible
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  });

  counters.forEach((counter) => counterObserver.observe(counter));
};

/**
 * Gestion des erreurs
 */
const initErrorHandling = () => {
  window.addEventListener('error', (e) => {
    console.warn('Erreur capturée:', e.error);
    // Fallback gracieux si Three.js échoue
    if (e.error && e.error.message.includes('WebGL')) {
      document.querySelector('#bg-animation').style.display = 'none';
    }
  });
};

/**
 * Performance monitoring
 */
const initPerformanceMonitoring = () => {
  // Surveiller les performances et ajuster si nécessaire
  let frameCount = 0;
  let lastTime = performance.now();

  const checkPerformance = () => {
    frameCount++;
    const currentTime = performance.now();

    if (currentTime - lastTime >= 1000) {
      const fps = frameCount;
      frameCount = 0;
      lastTime = currentTime;

      // Si les FPS sont trop bas, réduire la qualité
      if (fps < 30 && galaxy) {
        const currentCount = galaxy.geometry.attributes.position.count;
        if (currentCount > 5000) {
          // Réduire le nombre de particules
          console.log('Performance faible détectée, réduction des particules');
          // Ici on pourrait recréer la galaxie avec moins de particules
        }
      }
    }

    requestAnimationFrame(checkPerformance);
  };

  // Démarrer le monitoring seulement si ce n'est pas mobile
  if (!isMobile()) {
    checkPerformance();
  }
};

/* ===== INITIALISATION PRINCIPALE ===== */

/**
 * Initialisation de toutes les fonctionnalités
 */
const init = () => {
  try {
    // Fonctionnalités de base
    initLoadingScreen();
    initNavigation();
    initScrollAnimations();

    // Effets visuels
    initClickEffects();
    initTypingEffect();
    initCounterAnimations();

    // Three.js (avec gestion d'erreur)
    if (typeof THREE !== 'undefined') {
      initThreeJS();
    } else {
      console.warn('Three.js non disponible, animation de fond désactivée');
    }

    // Performance et erreurs
    initErrorHandling();
    initPerformanceMonitoring();

    // Log de succès
    console.log('✅ Portfolio initialisé avec succès');
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
    // Fallback gracieux
    document.body.classList.add('no-js-fallback');
  }
};

/* ===== LANCEMENT ===== */

// Démarrer quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Nettoyage à la fermeture de la page
window.addEventListener('beforeunload', () => {
  if (renderer) {
    renderer.dispose();
  }
  if (scene) {
    scene.clear();
  }
});
