/**
 * SEO Meta Tag Checker — pure client-side audit.
 * Parsing uses DOMParser so pasted HTML is never executed.
 * Scoring is weighted to 100 and every check returns pass/warn/fail + a fix.
 */
(function () {
  "use strict";

  // ---------- Parsing helpers ----------
  function parseHTML(html) {
    return new DOMParser().parseFromString(html, "text/html");
  }
  function meta(doc, selector) {
    var el = doc.querySelector(selector);
    return el ? (el.getAttribute("content") || "").trim() : "";
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
  function metaTag(doc, name, attr) {
    attr = attr || "name";
    return meta(doc, 'meta[' + attr + '="' + name + '"]');
  }

  // ---------- Individual checks (each: {id,label,status,points,max,detail,fix}) ----------
  function checkTitle(doc) {
    var t = (doc.title || "").trim();
    if (!t) return { id: "title", label: "Title tag", status: "fail", points: 0, max: 15, detail: "No <title> found.", fix: "<title>Your Page Title — Brand</title>" };
    if (t.length >= 50 && t.length <= 60) return { id: "title", label: "Title tag", status: "pass", points: 15, max: 15, detail: '"' + t + '" (' + t.length + " chars — ideal 50–60)." };
    if (t.length >= 30 && t.length <= 65) return { id: "title", label: "Title tag", status: "warn", points: 10, max: 15, detail: '"' + t + '" (' + t.length + " chars — aim for 50–60 so it is not cut off in Google)." };
    return { id: "title", label: "Title tag", status: "warn", points: 5, max: 15, detail: '"' + t + '" (' + t.length + " chars — too " + (t.length < 30 ? "short" : "long") + "; aim for 50–60).", fix: "<title>" + t + "</title> <!-- rewrite to 50–60 chars -->" };
  }

  function checkDescription(doc) {
    var d = metaTag(doc, "description");
    if (!d) return { id: "description", label: "Meta description", status: "fail", points: 0, max: 15, detail: "No meta description found. Google will invent one from the page text.", fix: '<meta name="description" content="Write a 150–160 character summary with your main keyword and a reason to click.">' };
    if (d.length >= 140 && d.length <= 160) return { id: "description", label: "Meta description", status: "pass", points: 15, max: 15, detail: d.length + " chars — ideal 140–160." };
    if (d.length >= 120 && d.length <= 165) return { id: "description", label: "Meta description", status: "warn", points: 10, max: 15, detail: d.length + " chars — close; aim for 140–160." };
    return { id: "description", label: "Meta description", status: "warn", points: 5, max: 15, detail: d.length + " chars — too " + (d.length < 120 ? "short" : "long") + "; aim for 140–160.", fix: '<meta name="description" content="Rewrite to 140–160 chars (currently ' + d.length + ').">' };
  }

  function checkHeadings(doc) {
    var h1s = doc.querySelectorAll("h1");
    var headings = doc.querySelectorAll("h1,h2,h3,h4,h5,h6");
    var levels = Array.prototype.map.call(headings, function (h) { return Number(h.tagName[1]); });
    var skips = false;
    for (var i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) skips = true;
    if (h1s.length === 1 && !skips) return { id: "headings", label: "Headings", status: "pass", points: 12, max: 12, detail: "Exactly one H1 and no skipped heading levels (" + headings.length + " headings total)." };
    if (h1s.length === 0) return { id: "headings", label: "Headings", status: "fail", points: 0, max: 12, detail: "No H1 found. Every page needs one H1 stating its main topic.", fix: "<h1>Your main page topic</h1>" };
    var why = h1s.length > 1 ? h1s.length + " H1 tags found — use exactly one." : "Heading levels are skipped (e.g. H1 → H3), which confuses screen readers and crawlers.";
    return { id: "headings", label: "Headings", status: "warn", points: 6, max: 12, detail: why };
  }

  function checkSocial(doc, prefix, names, max) {
    var found = names.filter(function (n) {
      var own = metaTag(doc, prefix + ":" + n, "property") || metaTag(doc, prefix + ":" + n);
      // Twitter/X falls back to Open Graph for title, description and image
      return own || (prefix === "twitter" && n !== "card" && (metaTag(doc, "og:" + n, "property") || metaTag(doc, "og:" + n)));
    });
    var missing = names.filter(function (n) { return found.indexOf(n) === -1; });
    var label = prefix === "og" ? "Open Graph tags" : "Twitter Card tags";
    var points = Math.round(max * (found.length / names.length));
    if (!missing.length) return { id: prefix, label: label, status: "pass", points: max, max: max, detail: "All key tags present: " + names.map(function (n) { return prefix + ":" + n; }).join(", ") + "." };
    var fix = missing.map(function (n) { return '<meta ' + (prefix === "og" ? 'property' : 'name') + '="' + prefix + ":" + n + '" content="...">'; }).join("\n");
    return { id: prefix, label: label, status: found.length ? "warn" : "fail", points: points, max: max, detail: "Missing: " + missing.map(function (n) { return prefix + ":" + n; }).join(", ") + ". Shares will look broken/incomplete without them.", fix: fix };
  }

  function checkCanonical(doc) {
    var el = doc.querySelector('link[rel="canonical"]');
    var href = el ? (el.getAttribute("href") || "") : "";
    if (href && /^https?:\/\//.test(href)) return { id: "canonical", label: "Canonical URL", status: "pass", points: 10, max: 10, detail: href };
    if (href) return { id: "canonical", label: "Canonical URL", status: "warn", points: 5, max: 10, detail: "Canonical exists but is not an absolute URL: " + href, fix: '<link rel="canonical" href="https://example.com/this-page">' };
    return { id: "canonical", label: "Canonical URL", status: "fail", points: 0, max: 10, detail: "No canonical tag. Duplicate versions of this page can compete with each other.", fix: '<link rel="canonical" href="https://example.com/this-page">' };
  }

  function checkAltText(doc) {
    var imgs = doc.querySelectorAll("img");
    var id = "alt", label = "Image alt text";
    if (!imgs.length) return { id: id, label: label, status: "pass", points: 12, max: 12, detail: "No <img> tags on this page — nothing to check." };
    var missing = Array.prototype.filter.call(imgs, function (img) { return !img.hasAttribute("alt"); }).length;
    var decorative = Array.prototype.filter.call(imgs, function (img) { return img.hasAttribute("alt") && img.getAttribute("alt").trim() === ""; }).length;
    if (!missing) return { id: id, label: label, status: "pass", points: 12, max: 12, detail: imgs.length + " image(s) all have an alt attribute" + (decorative ? " (" + decorative + " empty — fine only for purely decorative images)." : ".") };
    var points = Math.max(0, Math.round(12 * (1 - missing / imgs.length)));
    return { id: id, label: label, status: missing === imgs.length ? "fail" : "warn", points: points, max: 12, detail: missing + " of " + imgs.length + " images have no alt attribute (needed for accessibility + image search).", fix: '<img src="photo.jpg" alt="Describe the image in plain words">' };
  }

  function checkJsonLd(doc) {
    var scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    if (!scripts.length) return { id: "jsonld", label: "JSON-LD structured data", status: "warn", points: 0, max: 10, detail: "No JSON-LD found. It is optional, but it makes the page eligible for rich results (FAQ, ratings, etc.).", fix: '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":"Page name"}</scr' + 'ipt>' };
    var types = [], valid = 0;
    scripts.forEach(function (s) {
      try { var data = JSON.parse(s.textContent); var list = Array.isArray(data) ? data : [data]; list.forEach(function (d) { if (d["@type"]) types.push(d["@type"]); }); valid++; }
      catch (e) { /* invalid JSON counted below */ }
    });
    if (valid === scripts.length) return { id: "jsonld", label: "JSON-LD structured data", status: "pass", points: 10, max: 10, detail: scripts.length + " valid block(s)" + (types.length ? " — types: " + types.join(", ") : "") + "." };
    return { id: "jsonld", label: "JSON-LD structured data", status: "fail", points: 3, max: 10, detail: (scripts.length - valid) + " JSON-LD block(s) contain invalid JSON and will be ignored by Google. Validate at search.google.com/test/rich-results." };
  }

  function checkBasics(doc) {
    var items = [];
    if ((doc.documentElement.getAttribute("lang") || "").trim()) items.push("lang attribute ✓"); else items.push("missing lang attribute");
    if (doc.querySelector('meta[name="viewport"]')) items.push("viewport ✓"); else items.push("missing viewport (mobile)");
    if (doc.querySelector("meta[charset]")) items.push("charset ✓"); else items.push("missing charset");
    var missingCount = items.filter(function (i) { return i.indexOf("missing") === 0; }).length;
    var points = 10 - missingCount * 4; if (points < 0) points = 0;
    return { id: "basics", label: "Technical basics", status: missingCount === 0 ? "pass" : "warn", points: points, max: 10, detail: items.join(" · ") + "." };
  }

  function runAudit(html) {
    var doc = parseHTML(html);
    var checks = [checkTitle(doc), checkDescription(doc), checkHeadings(doc),
      checkSocial(doc, "og", ["title", "description", "image", "url", "type"], 8),
      checkSocial(doc, "twitter", ["card", "title", "description", "image"], 8),
      checkCanonical(doc), checkAltText(doc), checkJsonLd(doc), checkBasics(doc)];
    var score = checks.reduce(function (sum, c) { return sum + c.points; }, 0);
    return { doc: doc, checks: checks, score: score };
  }

  function buildFixBlock(doc) {
    var E = esc;
    var title = (doc.title || "YOUR TITLE (50–60 chars)").trim();
    var desc = metaTag(doc, "description") || "YOUR DESCRIPTION (140–160 chars, keyword + reason to click)";
    var canEl = doc.querySelector('link[rel="canonical"]');
    var canonical = (canEl && canEl.getAttribute("href")) || "https://example.com/this-page";
    var ogImg = metaTag(doc, "og:image", "property") || "https://example.com/og-image.jpg";
    var ogT = metaTag(doc, "og:title", "property") || title, ogD = metaTag(doc, "og:description", "property") || desc;
    var twT = metaTag(doc, "twitter:title") || title, twD = metaTag(doc, "twitter:description") || desc, twI = metaTag(doc, "twitter:image") || ogImg;
    return [
      "<title>" + E(title) + "</title>",
      '<meta name="description" content="' + E(desc) + '">',
      '<link rel="canonical" href="' + E(canonical) + '">',
      '<meta property="og:type" content="website">',
      '<meta property="og:title" content="' + E(ogT) + '">',
      '<meta property="og:description" content="' + E(ogD) + '">',
      '<meta property="og:url" content="' + E(canonical) + '">',
      '<meta property="og:image" content="' + E(ogImg) + '">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:title" content="' + E(twT) + '">',
      '<meta name="twitter:description" content="' + E(twD) + '">',
      '<meta name="twitter:image" content="' + E(twI) + '">'
    ].join("\n");
  }

  // Exposed for tests (open tests.html in a browser)
  if (typeof module !== "undefined" && module.exports) module.exports = { runAudit: runAudit, buildFixBlock: buildFixBlock };

  if (typeof window !== "undefined") window.SEOChecker = { runAudit: runAudit, buildFixBlock: buildFixBlock };

  // ---------- UI (browser only) ----------
  if (typeof document === "undefined" || !document.getElementById("check-btn")) return;
  var $ = function (id) { return document.getElementById(id); };
  var tabs = { html: $("tab-html"), url: $("tab-url") };
  function selectTab(name) {
    var isHtml = name === "html";
    tabs.html.classList.toggle("is-active", isHtml); tabs.url.classList.toggle("is-active", !isHtml);
    tabs.html.setAttribute("aria-selected", String(isHtml)); tabs.url.setAttribute("aria-selected", String(!isHtml));
    $("panel-html").hidden = !isHtml; $("panel-url").hidden = isHtml;
  }
  tabs.html.addEventListener("click", function () { selectTab("html"); });
  tabs.url.addEventListener("click", function () { selectTab("url"); });
  [tabs.html, tabs.url].forEach(function (t) {
    t.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      var next = t === tabs.html ? tabs.url : tabs.html;
      selectTab(next === tabs.html ? "html" : "url"); next.focus();
    });
  });

  var SAMPLE = '<!DOCTYPE html><html><head><title>Short</title></head><body><h1>Demo</h1><h3>Skipped H2</h3><img src="cat.jpg"><p>Sample page with several real SEO problems to find.</p></body></html>';

  function render(result) {
    $("results").hidden = false;
    $("score-value").textContent = result.score;
    var ring = document.querySelector(".score-circle");
    ring.style.setProperty("--pct", result.score + "%");
    ring.dataset.level = result.score >= 85 ? "good" : result.score >= 60 ? "ok" : "bad";
    var fails = result.checks.filter(function (c) { return c.status === "fail"; }).length;
    var warns = result.checks.filter(function (c) { return c.status === "warn"; }).length;
    $("score-summary").textContent = result.score >= 85 ? "Strong page — only small polish left." : result.score >= 60 ? "Decent base — " + fails + " fail(s), " + warns + " warning(s) to fix." : "Needs work — start with the failed checks below, they carry the most points.";
    $("checks").innerHTML = "";
    var order = { fail: 0, warn: 1, pass: 2 };
    result.checks.slice().sort(function (a, b) { return order[a.status] - order[b.status]; }).forEach(function (c) {
      var div = document.createElement("article"); div.className = "check " + c.status;
      var badge = c.status === "pass" ? "Pass" : c.status === "warn" ? "Warning" : "Fail";
      div.innerHTML = '<h4></h4><span class="badge"></span> <span class="pts"></span><p class="detail"></p>';
      div.style.setProperty("--w", Math.round(c.points / c.max * 100) + "%");
      div.querySelector("h4").textContent = c.label;
      div.querySelector(".badge").textContent = badge;
      div.querySelector(".pts").textContent = "· " + c.points + "/" + c.max + " pts";
      div.querySelector(".detail").textContent = c.detail;
      if (c.fix) {
        var pre = document.createElement("pre"); pre.textContent = c.fix; pre.tabIndex = 0;
        var btn = document.createElement("button"); btn.type = "button"; btn.className = "copy-fix"; btn.textContent = "Copy this fix";
        btn.addEventListener("click", function () { copyText(c.fix, btn); });
        div.appendChild(pre); div.appendChild(btn);
      }
      $("checks").appendChild(div);
    });
    var n = { pass: 0, warn: 0, fail: 0 };
    result.checks.forEach(function (c) { n[c.status]++; });
    $("chips").innerHTML = '<span class="chip fail">' + n.fail + ' failed</span><span class="chip warn">' + n.warn + ' warnings</span><span class="chip pass">' + n.pass + ' passed</span>';
    $("fix-output").textContent = buildFixBlock(result.doc);
    $("results").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function copyText(text, btn) {
    function done() { $("copy-status").textContent = "Copied to clipboard."; if (btn) { var old = btn.textContent; btn.textContent = "Copied ✓"; setTimeout(function () { btn.textContent = old; }, 1600); } }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallback(); }); else fallback();
    function fallback() { var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) { $("copy-status").textContent = "Copy failed — select the text and copy manually."; } ta.remove(); }
  }

  $("check-btn").addEventListener("click", function () {
    var htmlPanelActive = !$("panel-html").hidden;
    if (htmlPanelActive) {
      var html = $("html-input").value.trim();
      if (!html) { $("status").textContent = "Paste some HTML first — or load the sample."; return; }
      $("status").textContent = ""; render(runAudit(html));
    } else {
      var url = $("url-input").value.trim();
      if (!/^https?:\/\//.test(url)) { $("status").textContent = "Enter a full URL starting with https://"; return; }
      $("status").textContent = "Fetching…";
      fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (html) { $("status").textContent = ""; render(runAudit(html)); })
        .catch(function () { $("status").textContent = "Could not fetch that URL (the site likely blocks cross-site reading / CORS). Use View Source + Paste HTML instead — it gives identical results."; });
    }
  });
  $("sample-btn").addEventListener("click", function () { selectTab("html"); $("html-input").value = SAMPLE; render(runAudit(SAMPLE)); });
  $("clear-btn").addEventListener("click", function () { $("html-input").value = ""; $("url-input").value = ""; $("results").hidden = true; $("status").textContent = ""; });
  $("copy-fix-btn").addEventListener("click", function () { copyText($("fix-output").textContent); });
})();
