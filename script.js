/* ==========================================================================
   CONFIG — edit these
   ========================================================================== */
const CF_HANDLE = "";               // <-- put your Codeforces handle here to pull LIVE stats
const FALLBACK_STATS = {            // used until a handle is set / if the fetch fails
  allTime: 593, lastYear: 282, lastMonth: 10,
  maxStreak: 537, lastYearStreak: 364, lastMonthStreak: 30
};

document.addEventListener("DOMContentLoaded", () => {
  initCursor();
  initAmbientBlobs();
  initScrollProgress();
  initNav();
  initReveal();
  initTypeRotator();
  initHeatmap();
  initCarousel();
  document.getElementById("year").textContent = new Date().getFullYear();
});

/* ==========================================================================
   CUSTOM CURSOR
   ========================================================================== */
function initCursor(){
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  if (isTouch) return;

  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  let mx = window.innerWidth/2, my = window.innerHeight/2;
  let rx = mx, ry = my;

  window.addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; });

  function loop(){
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  document.querySelectorAll('[data-cursor="hover"]').forEach(el => {
    el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
  });
  document.querySelectorAll('[data-cursor="text"]').forEach(el => {
    el.addEventListener("mouseenter", () => ring.classList.add("is-text"));
    el.addEventListener("mouseleave", () => ring.classList.remove("is-text"));
  });
}

/* ==========================================================================
   AMBIENT LIQUID BACKGROUND — parallax + slow autonomous drift
   ========================================================================== */
function initAmbientBlobs(){
  const el = document.getElementById("blob-canvas");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  let px = 0, py = 0, tx = 0, ty = 0;
  window.addEventListener("mousemove", e => {
    tx = (e.clientX / window.innerWidth  - 0.5) * 40;
    ty = (e.clientY / window.innerHeight - 0.5) * 40;
  });

  let t = 0;
  function loop(){
    t += 0.0022;
    px += (tx - px) * 0.03;
    py += (ty - py) * 0.03;
    const driftX = Math.sin(t) * 18;
    const driftY = Math.cos(t * 0.8) * 18;
    el.style.transform = `translate3d(${px + driftX}px, ${py + driftY}px, 0)`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ==========================================================================
   SCROLL PROGRESS BAR
   ========================================================================== */
function initScrollProgress(){
  const bar = document.getElementById("scrollBar");
  window.addEventListener("scroll", () => {
    const h = document.documentElement;
    const pct = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    bar.style.width = pct + "%";
  }, { passive: true });
}

/* ==========================================================================
   NAV — scrolled state + mobile menu
   ========================================================================== */
function initNav(){
  const nav = document.getElementById("siteNav");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("nav--scrolled", window.scrollY > 10);
  }, { passive: true });

  const burger = document.getElementById("navBurger");
  const menu = document.getElementById("mobileMenu");
  burger.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    menu.classList.remove("is-open");
    burger.classList.remove("is-open");
    document.body.style.overflow = "";
  }));
}

/* ==========================================================================
   SCROLL REVEALS (+ count-up stats, + skill meter fill)
   ========================================================================== */
function initReveal(){
  const targets = document.querySelectorAll(".reveal, .reveal-line");
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");

      entry.target.querySelectorAll("[data-count]").forEach(countUp);
      if (entry.target.matches("[data-count]")) countUp(entry.target);

      entry.target.querySelectorAll(".skill-feature__fill").forEach(fillMeter);
      if (entry.target.matches(".skill-feature__fill")) fillMeter(entry.target);

      io.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });

  targets.forEach(t => io.observe(t));
}

function countUp(el){
  if (el.dataset.done) return;
  el.dataset.done = "1";
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || "";
  const dur = 1400;
  const start = performance.now();
  function tick(now){
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function fillMeter(el){
  requestAnimationFrame(() => { el.style.width = el.dataset.fill + "%"; });
}

/* ==========================================================================
   HERO TYPE ROTATOR
   ========================================================================== */
function initTypeRotator(){
  const el = document.getElementById("typeRotator");
  const words = ["C++ contests", "algorithm design", "full-stack builds", "robotics"];
  let wi = 0, ci = 0, deleting = false;

  function tick(){
    const word = words[wi];
    if (!deleting){
      ci++;
      el.textContent = word.slice(0, ci);
      if (ci === word.length){ deleting = true; setTimeout(tick, 1300); return; }
    } else {
      ci--;
      el.textContent = word.slice(0, ci);
      if (ci === 0){ deleting = false; wi = (wi + 1) % words.length; }
    }
    setTimeout(tick, deleting ? 35 : 65);
  }
  tick();
}

/* ==========================================================================
   CODEFORCES STREAK HEATMAP
   ========================================================================== */
async function initHeatmap(){
  const note = document.getElementById("cfHandleNote");
  const status = document.getElementById("heatmapStatus");

  let dayActivity = new Map();
  let stats = FALLBACK_STATS;
  let live = false;

  if (CF_HANDLE.trim()){
    try{
      const res = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(CF_HANDLE.trim())}`);
      const json = await res.json();
      if (json.status !== "OK") throw new Error("bad handle");
      const submissions = json.result;

      const solvedFirst = new Map();
      submissions.forEach(sub => {
        if (sub.verdict !== "OK") return;
        const day = new Date(sub.creationTimeSeconds * 1000).toISOString().slice(0, 10);
        dayActivity.set(day, (dayActivity.get(day) || 0) + 1);
        const key = sub.problem.contestId + "-" + sub.problem.index;
        const prev = solvedFirst.get(key);
        if (!prev || day < prev) solvedFirst.set(key, day);
      });

      const today = new Date();
      const daysAgo = (d) => Math.floor((today - new Date(d)) / 86400000);

      stats = {
        allTime: solvedFirst.size,
        lastYear: [...solvedFirst.values()].filter(d => daysAgo(d) <= 365).length,
        lastMonth: [...solvedFirst.values()].filter(d => daysAgo(d) <= 30).length,
        maxStreak: longestStreak(dayActivity),
        lastYearStreak: longestStreak(dayActivity, 365),
        lastMonthStreak: longestStreak(dayActivity, 30),
      };
      live = true;
      note.innerHTML = `Live data for <code>${CF_HANDLE}</code> — pulled straight from the Codeforces API.`;
      status.innerHTML = `<span class="dot dot--live"></span>Live`;
    } catch (err){
      dayActivity = demoActivity();
      note.textContent = `Couldn't reach Codeforces for "${CF_HANDLE}" — showing sample data instead.`;
      status.innerHTML = `<span class="dot"></span>Sample data`;
    }
  } else {
    dayActivity = demoActivity();
  }

  renderHeatmap(dayActivity, stats, live);
}

// longest run of consecutive active days, optionally within the last `windowDays`
function longestStreak(dayActivity, windowDays){
  const today = new Date();
  const dates = [...dayActivity.keys()].filter(d => {
    if (!windowDays) return true;
    return Math.floor((today - new Date(d)) / 86400000) <= windowDays;
  }).sort();
  if (!dates.length) return 0;

  let longest = 1, run = 1;
  for (let i = 1; i < dates.length; i++){
    const gap = Math.round((new Date(dates[i]) - new Date(dates[i-1])) / 86400000);
    run = gap === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return longest;
}

// deterministic-ish demo dataset that mirrors a long, mostly-unbroken streak
function demoActivity(){
  const map = new Map();
  const days = 371;
  const today = new Date();
  let seed = 42;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const weights = [0,1,1,1,2,2,2,3,3,4];

  for (let i = days - 1; i >= 0; i--){
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const isGapDay = (i === 0) || (i > 5 && rand() < 0.012); // today + a couple of rare misses
    map.set(key, isGapDay ? 0 : weights[Math.floor(rand() * weights.length)] || 1);
  }
  return map;
}

function renderHeatmap(dayActivity, stats, live){
  const container = document.getElementById("heatmap");
  const monthsRow = document.createElement("div");
  monthsRow.className = "heatmap__months";
  const body = document.createElement("div");
  body.className = "heatmap__body";

  const dayLabels = document.createElement("div");
  dayLabels.className = "heatmap__daylabels";
  ["", "Mon", "", "Wed", "", "Fri", ""].forEach(l => {
    const s = document.createElement("span"); s.textContent = l; dayLabels.appendChild(s);
  });

  const grid = document.createElement("div");
  grid.className = "heatmap__grid";

  const today = new Date();
  const totalDays = 371;
  const start = new Date(today); start.setDate(start.getDate() - (totalDays - 1));
  // align to the previous Sunday
  start.setDate(start.getDate() - start.getDay());

  const tooltip = document.getElementById("heatmapTooltip");
  let col = -1, lastMonth = -1;
  let cursor = new Date(start);

  while (cursor <= today){
    const dow = cursor.getDay();
    if (dow === 0) col++;

    if (dow === 0 && cursor.getMonth() !== lastMonth){
      lastMonth = cursor.getMonth();
      const label = document.createElement("span");
      label.textContent = cursor.toLocaleDateString("en-US", { month: "short" });
      label.style.position = "absolute";
      label.style.left = (col * 16) + "px";
      monthsRow.appendChild(label);
    }

    const key = cursor.toISOString().slice(0, 10);
    const count = dayActivity.get(key) || 0;
    const level = count === 0 ? 0 : count === 1 ? 1 : count <= 2 ? 2 : count <= 4 ? 3 : 4;

    const cell = document.createElement("div");
    cell.className = "heatmap-cell";
    cell.dataset.level = cursor > today ? "" : level;
    cell.dataset.date = key;
    cell.dataset.count = count;

    if (cursor <= today){
      cell.addEventListener("mousemove", (e) => showTooltip(e, key, count));
      cell.addEventListener("mouseleave", hideTooltip);
    } else {
      cell.style.visibility = "hidden";
    }

    grid.appendChild(cell);
    cursor.setDate(cursor.getDate() + 1);
  }

  monthsRow.style.marginLeft = "42px";
  body.appendChild(dayLabels);
  body.appendChild(grid);
  container.appendChild(monthsRow);
  container.appendChild(body);

  function showTooltip(e, dateStr, count){
    tooltip.textContent = `${count} solved · ${new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    tooltip.style.left = e.clientX + "px";
    tooltip.style.top = e.clientY + "px";
    tooltip.classList.add("is-visible");
  }
  function hideTooltip(){ tooltip.classList.remove("is-visible"); }

  const foot = document.getElementById("heatmapFoot");
  foot.innerHTML = `
    <div class="heatmap-foot__item"><strong>${stats.allTime}</strong><span>problems · all time</span></div>
    <div class="heatmap-foot__item"><strong>${stats.lastYear}</strong><span>problems · last year</span></div>
    <div class="heatmap-foot__item"><strong>${stats.lastMonth}</strong><span>problems · last month</span></div>
    <div class="heatmap-foot__item heatmap-foot__item--flag"><strong>${stats.maxStreak}</strong><span>days in a row · max</span></div>
    <div class="heatmap-foot__item"><strong>${stats.lastYearStreak}</strong><span>days in a row · last year</span></div>
    <div class="heatmap-foot__item"><strong>${stats.lastMonthStreak}</strong><span>days in a row · last month</span></div>
  `;
}

/* ==========================================================================
   PROJECT CAROUSEL — smooth slide + drag + dots
   ========================================================================== */
function initCarousel(){
  const track = document.getElementById("projectTrack");
  const cards = [...track.children];
  const dotsWrap = document.getElementById("carouselDots");
  const prevBtn = document.getElementById("prevProj");
  const nextBtn = document.getElementById("nextProj");

  cards.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.addEventListener("click", () => scrollToCard(i));
    dotsWrap.appendChild(dot);
  });
  const dots = [...dotsWrap.children];

  function cardStep(){
    const style = getComputedStyle(track);
    return cards[0].getBoundingClientRect().width + parseFloat(style.gap || 22);
  }
  function scrollToCard(i){
    track.scrollTo({ left: i * cardStep(), behavior: "smooth" });
  }
  function updateDots(){
    const i = Math.round(track.scrollLeft / cardStep());
    dots.forEach((d, idx) => d.classList.toggle("is-active", idx === i));
  }

  prevBtn.addEventListener("click", () => scrollToCard(Math.max(0, Math.round(track.scrollLeft / cardStep()) - 1)));
  nextBtn.addEventListener("click", () => scrollToCard(Math.min(cards.length - 1, Math.round(track.scrollLeft / cardStep()) + 1)));
  track.addEventListener("scroll", () => requestAnimationFrame(updateDots), { passive: true });
  updateDots();

  // drag-to-scroll for mouse / trackpad users
  let isDown = false, startX = 0, startScroll = 0, moved = false;
  track.addEventListener("pointerdown", (e) => {
    isDown = true; moved = false;
    startX = e.clientX; startScroll = track.scrollLeft;
    track.classList.add("is-dragging");
  });
  window.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    track.scrollLeft = startScroll - dx;
  });
  window.addEventListener("pointerup", () => {
    isDown = false;
    track.classList.remove("is-dragging");
    updateDots();
  });
  // prevent accidental link click right after a drag
  track.addEventListener("click", (e) => { if (moved) e.preventDefault(); }, true);
}
