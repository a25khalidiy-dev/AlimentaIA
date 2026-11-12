"use strict";

/* ---------- Tema claro/oscuro ---------- */
const root = document.documentElement;
const themeBtn = document.getElementById("themeToggle");
function setTheme(t) {
  root.setAttribute("data-theme", t);
  themeBtn.textContent = t === "dark" ? "☀️" : "🌙";
  try { localStorage.setItem("theme", t); } catch (e) {}
}
let saved = null;
try { saved = localStorage.getItem("theme"); } catch (e) {}
setTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
themeBtn.addEventListener("click", () =>
  setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"));

/* ---------- Menú móvil ---------- */
const menu = document.getElementById("menu");
const menuBtn = document.getElementById("menuToggle");
menuBtn.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
});
menu.querySelectorAll("a").forEach(a =>
  a.addEventListener("click", () => { menu.classList.remove("open"); menuBtn.setAttribute("aria-expanded", false); }));

/* ---------- Aparición al hacer scroll ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* ---------- Contadores ---------- */
document.querySelectorAll("[data-count]").forEach(el => {
  const target = +el.dataset.count, suffix = el.dataset.suffix || "";
  let n = 0;
  const step = Math.max(1, Math.ceil(target / 40));
  const t = setInterval(() => {
    n = Math.min(target, n + step);
    el.textContent = n + suffix;
    if (n >= target) clearInterval(t);
  }, 30);
});

/* ---------- Enlace activo + botón subir ---------- */
const links = [...menu.querySelectorAll("a")];
const sections = links.map(a => document.querySelector(a.getAttribute("href")));
const toTop = document.getElementById("toTop");
window.addEventListener("scroll", () => {
  const y = window.scrollY + 120;
  sections.forEach((s, i) => {
    if (!s) return;
    links[i].classList.toggle("active", y >= s.offsetTop && y < s.offsetTop + s.offsetHeight);
  });
  toTop.hidden = window.scrollY < 600;
}, { passive: true });
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ---------- Demo: despensa digital (valores por 100 g, ilustrativos) ---------- */
const FOODS = [
  { id: "pasta",   emoji: "🍝", name: "Pasta",          kcal: 350, p: 12,  c: 71,  g: 1.5, def: 80 },
  { id: "tomate",  emoji: "🍅", name: "Tomate frito",   kcal: 80,  p: 1.5, c: 10,  g: 4,   def: 100 },
  { id: "pollo",   emoji: "🍗", name: "Pechuga pollo",  kcal: 120, p: 23,  c: 0,   g: 2.6, def: 120 },
  { id: "arroz",   emoji: "🍚", name: "Arroz",          kcal: 360, p: 7,   c: 79,  g: 0.6, def: 70 },
  { id: "aceite",  emoji: "🫒", name: "Aceite de oliva",kcal: 884, p: 0,   c: 0,   g: 100, def: 10 },
  { id: "queso",   emoji: "🧀", name: "Queso",          kcal: 350, p: 25,  c: 1.3, g: 28,  def: 30 },
  { id: "huevo",   emoji: "🥚", name: "Huevos",         kcal: 143, p: 12.6,c: 0.7, g: 9.5, def: 100 },
  { id: "ensalada",emoji: "🥗", name: "Ensalada mixta", kcal: 20,  p: 1.5, c: 3,   g: 0.2, def: 100 }
];
const plate = new Map(); // id -> gramos

const pantryEl = document.getElementById("pantry");
const listEl = document.getElementById("plateList");
const totalsEl = document.getElementById("totals");
const splitEl = document.getElementById("split");
const clearBtn = document.getElementById("clearPlate");

pantryEl.innerHTML = FOODS.map(f =>
  `<button class="item" data-id="${f.id}"><span class="e">${f.emoji}</span><span>${f.name}<small>${f.kcal} kcal/100 g</small></span></button>`
).join("");

pantryEl.addEventListener("click", e => {
  const btn = e.target.closest(".item");
  if (!btn) return;
  const f = FOODS.find(x => x.id === btn.dataset.id);
  if (!plate.has(f.id)) plate.set(f.id, f.def);
  renderPlate();
});

listEl.addEventListener("input", e => {
  if (e.target.matches("input[type=range]")) {
    plate.set(e.target.dataset.id, +e.target.value);
    renderPlate(true);
  }
});
listEl.addEventListener("click", e => {
  const b = e.target.closest("button[data-del]");
  if (b) { plate.delete(b.dataset.del); renderPlate(); }
});
clearBtn.addEventListener("click", () => { plate.clear(); renderPlate(); });

function renderPlate(keepList) {
  const has = plate.size > 0;
  totalsEl.hidden = splitEl.hidden = clearBtn.hidden = !has;

  if (!keepList) {
    listEl.innerHTML = has
      ? [...plate].map(([id, gr]) => {
          const f = FOODS.find(x => x.id === id);
          return `<div class="row"><span>${f.emoji}</span><span class="name">${f.name}</span>
            <input type="range" min="5" max="300" step="5" value="${gr}" data-id="${id}" aria-label="Gramos de ${f.name}">
            <span class="g" data-g="${id}">${gr} g</span>
            <button data-del="${id}" aria-label="Quitar ${f.name}">✕</button></div>`;
        }).join("")
      : `<p class="muted">Añade productos de la despensa para analizar tu plato.</p>`;
  } else {
    plate.forEach((gr, id) => { listEl.querySelector(`[data-g="${id}"]`).textContent = gr + " g"; });
  }

  let kcal = 0, p = 0, c = 0, g = 0;
  plate.forEach((gr, id) => {
    const f = FOODS.find(x => x.id === id), k = gr / 100;
    kcal += f.kcal * k; p += f.p * k; c += f.c * k; g += f.g * k;
  });
  document.getElementById("tKcal").textContent = Math.round(kcal);
  document.getElementById("tP").textContent = p.toFixed(1);
  document.getElementById("tC").textContent = c.toFixed(1);
  document.getElementById("tG").textContent = g.toFixed(1);

  const sum = p * 4 + c * 4 + g * 9 || 1;
  document.getElementById("sP").style.width = (p * 4 / sum * 100) + "%";
  document.getElementById("sC").style.width = (c * 4 / sum * 100) + "%";
  document.getElementById("sG").style.width = (g * 9 / sum * 100) + "%";
}

/* ---------- Servicios AWS (pestañas) ---------- */
const SERVICES = [
  { tab: "Motor de IA y Visión", tag: "Amazon SageMaker + Rekognition / Textract", from: "Modelos entrenados en servidores locales de la empresa",
    text: "Textract lee automáticamente los valores nutricionales de las fotos de los rótulos (OCR), mientras SageMaker aloja y escala el modelo de Deep Learning que reconoce los platos cocinados." },
  { tab: "Repositorio de fotos", tag: "Amazon S3", from: "Discos locales con imágenes de rótulos y platos",
    text: "Almacenamiento de objetos muy duradero y económico para fotos de envases y comidas, con cifrado automático activado para cumplir el RGPD." },
  { tab: "Despensa y usuarios", tag: "Amazon DynamoDB (o RDS)", from: "Base de datos local de usuarios, historiales y dietas",
    text: "Base de datos gestionada de latencia muy baja para cruzar al instante los ingredientes de la foto con la despensa digital y el perfil dietético." },
  { tab: "Backend y API socios", tag: "AWS Lambda + API Gateway", from: "API de integración con marcas y proveedores",
    text: "Arquitectura serverless que atiende las peticiones de la app móvil y conecta con los proveedores de trazabilidad, cobrando solo por los milisegundos de ejecución." },
  { tab: "Seguridad y RGPD", tag: "AWS KMS + AWS IAM", from: "Control de acceso y claves gestionados manualmente",
    text: "KMS gestiona las claves de cifrado e IAM controla los accesos de forma rigurosa, bajo supervisión del DPO / especialista en ciberseguridad." }
];
const tabList = document.getElementById("tabList");
const tabPanel = document.getElementById("tabPanel");
tabList.innerHTML = SERVICES.map((s, i) =>
  `<button class="tab${i === 0 ? " active" : ""}" role="tab" data-i="${i}">${s.tab}</button>`).join("");
function showTab(i) {
  const s = SERVICES[i];
  tabPanel.innerHTML = `<span class="tag">${s.tag}</span><h3>${s.tab}</h3><p>${s.text}</p><p class="from"><strong>Migra desde:</strong> ${s.from}</p>`;
  tabList.querySelectorAll(".tab").forEach((t, j) => t.classList.toggle("active", j === i));
}
tabList.addEventListener("click", e => { const t = e.target.closest(".tab"); if (t) showTab(+t.dataset.i); });
showTab(0);
