const API_BASE = "/api/v1";
const SESSION_KEY = "resumeBuilderSession";

const defaultPersonalInfo = {
  fullName: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  linkedin: "",
  github: ""
};

const sectionConfigs = {
  skills: {
    title: "Skills",
    empty: { name: "", level: "" },
    fields: [
      { key: "name", label: "Skill" },
      { key: "level", label: "Level" }
    ]
  },
  experience: {
    title: "Experience",
    empty: { company: "", role: "", startDate: "", endDate: "" },
    fields: [
      { key: "role", label: "Role" },
      { key: "company", label: "Company" },
      { key: "startDate", label: "Start" },
      { key: "endDate", label: "End" }
    ]
  },
  education: {
    title: "Education",
    empty: { degree: "", institution: "", year: "", cgpa: "" },
    fields: [
      { key: "degree", label: "Degree" },
      { key: "institution", label: "Institution" },
      { key: "year", label: "Year" },
      { key: "cgpa", label: "CGPA", type: "number", step: "0.01" }
    ]
  },
  projects: {
    title: "Projects",
    empty: { Projectname: "", stack: "", link: "", description: "" },
    fields: [
      { key: "Projectname", label: "Project name" },
      { key: "stack", label: "Stack" },
      { key: "link", label: "Link" },
      { key: "description", label: "Description", textarea: true }
    ]
  },
  certification: {
    title: "Certifications",
    empty: { title: "", issuer: "", date: "", description: "" },
    fields: [
      { key: "title", label: "Title" },
      { key: "issuer", label: "Issuer" },
      { key: "date", label: "Date" },
      { key: "description", label: "Description", textarea: true }
    ]
  },
  languages: {
    title: "Languages",
    empty: { name: "", level: "" },
    fields: [
      { key: "name", label: "Language" },
      { key: "level", label: "Level" }
    ]
  }
};

const state = {
  mode: "login",
  session: readSession(),
  resumes: [],
  activeResume: createBlankResume(),
  activeResumeId: null,
  shareId: new URLSearchParams(window.location.search).get("share"),
  toastTimer: null
};

const els = {
  toast: document.querySelector("#toast"),
  pageTitle: document.querySelector("#pageTitle"),
  sessionBar: document.querySelector("#sessionBar"),
  authView: document.querySelector("#authView"),
  appView: document.querySelector("#appView"),
  shareView: document.querySelector("#shareView"),
  loginTab: document.querySelector("#loginTab"),
  registerTab: document.querySelector("#registerTab"),
  loginForm: document.querySelector("#loginForm"),
  registerForm: document.querySelector("#registerForm"),
  resumeList: document.querySelector("#resumeList"),
  resumeCount: document.querySelector("#resumeCount"),
  resumeForm: document.querySelector("#resumeForm"),
  editorFields: document.querySelector("#editorFields"),
  previewPage: document.querySelector("#previewPage"),
  sharedPreviewPage: document.querySelector("#sharedPreviewPage"),
  newResumeBtn: document.querySelector("#newResumeBtn"),
  saveResumeBtn: document.querySelector("#saveResumeBtn"),
  shareResumeBtn: document.querySelector("#shareResumeBtn"),
  printResumeBtn: document.querySelector("#printResumeBtn"),
  backToBuilderBtn: document.querySelector("#backToBuilderBtn"),
  printSharedBtn: document.querySelector("#printSharedBtn")
};

init();

function init() {
  bindEvents();

  if (state.shareId) {
    loadSharedResume(state.shareId);
    return;
  }

  if (state.session?.AccessToken) {
    showApp();
    loadResumes();
  } else {
    showAuth();
  }
}

function bindEvents() {
  els.loginTab.addEventListener("click", () => setAuthMode("login"));
  els.registerTab.addEventListener("click", () => setAuthMode("register"));
  els.loginForm.addEventListener("submit", handleLogin);
  els.registerForm.addEventListener("submit", handleRegister);
  els.newResumeBtn.addEventListener("click", startNewResume);
  els.saveResumeBtn.addEventListener("click", () => saveActiveResume());
  els.shareResumeBtn.addEventListener("click", shareActiveResume);
  els.printResumeBtn.addEventListener("click", () => window.print());
  els.printSharedBtn.addEventListener("click", () => window.print());
  els.backToBuilderBtn.addEventListener("click", () => {
    window.history.replaceState({}, "", window.location.pathname);
    state.shareId = null;
    if (state.session?.AccessToken) {
      showApp();
      loadResumes();
    } else {
      showAuth();
    }
  });

  els.resumeForm.addEventListener("input", (event) => {
    const input = event.target;

    if (input.dataset.path) {
      setByPath(state.activeResume, input.dataset.path, input.value);
    }

    if (input.dataset.section) {
      const list = state.activeResume[input.dataset.section] || [];
      const item = list[Number(input.dataset.index)];

      if (item) {
        item[input.dataset.field] = input.value;
      }
    }

    renderPreview(state.activeResume, els.previewPage);
  });

  els.editorFields.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");

    if (!action) return;

    const section = action.dataset.section;

    if (action.dataset.action === "add") {
      state.activeResume[section] = state.activeResume[section] || [];
      state.activeResume[section].push({ ...sectionConfigs[section].empty });
    }

    if (action.dataset.action === "remove") {
      state.activeResume[section].splice(Number(action.dataset.index), 1);
    }

    renderEditor();
    renderPreview(state.activeResume, els.previewPage);
  });
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const identifier = String(form.get("identifier") || "").trim();
  const password = String(form.get("password") || "");
  const payload = identifier.includes("@")
    ? { email: identifier, password }
    : { username: identifier, password };

  try {
    const response = await apiRequest("/users/login", {
      method: "POST",
      body: payload,
      auth: false
    });

    saveSession(response.data);
    state.session = readSession();
    showToast("Logged in successfully.");
    showApp();
    await loadResumes();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = {
    fullname: String(form.get("fullname") || "").trim(),
    username: String(form.get("username") || "").trim(),
    email: String(form.get("email") || "").trim(),
    password: String(form.get("password") || "")
  };

  try {
    await apiRequest("/users/register", {
      method: "POST",
      body: payload,
      auth: false
    });

    const response = await apiRequest("/users/login", {
      method: "POST",
      body: {
        username: payload.username,
        password: payload.password
      },
      auth: false
    });

    saveSession(response.data);
    state.session = readSession();
    showToast("Account created.");
    showApp();
    await loadResumes();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function logout() {
  try {
    await apiRequest("/users/logout", { method: "POST" });
  } catch (error) {
    console.warn(error);
  } finally {
    localStorage.removeItem(SESSION_KEY);
    state.session = null;
    state.resumes = [];
    state.activeResume = createBlankResume();
    state.activeResumeId = null;
    showAuth();
  }
}

async function loadResumes() {
  try {
    const response = await apiRequest("/resumes");
    state.resumes = response.data || [];
    renderResumeList();

    if (state.resumes.length > 0) {
      await selectResume(state.resumes[0]._id);
    } else {
      startNewResume(false);
    }
  } catch (error) {
    showToast(error.message, "error");
    if (/unauthorized|invalid access|jwt/i.test(error.message)) {
      localStorage.removeItem(SESSION_KEY);
      state.session = null;
      showAuth();
    }
  }
}

async function selectResume(resumeId) {
  try {
    const response = await apiRequest(`/resumes/${resumeId}`);
    state.activeResume = hydrateResume(response.data);
    state.activeResumeId = response.data._id;
    renderResumeList();
    renderEditor();
    renderPreview(state.activeResume, els.previewPage);
  } catch (error) {
    showToast(error.message, "error");
  }
}

function startNewResume(renderList = true) {
  state.activeResume = createBlankResume();
  state.activeResumeId = null;

  if (renderList) {
    renderResumeList();
  }

  renderEditor();
  renderPreview(state.activeResume, els.previewPage);
}

async function saveActiveResume(overrides = {}) {
  const payload = normalizeResume({
    ...state.activeResume,
    ...overrides
  });

  if (!payload.summary) {
    showToast("Summary is required before saving.", "error");
    return null;
  }

  try {
    const path = state.activeResumeId ? `/resumes/${state.activeResumeId}` : "/resumes";
    const method = state.activeResumeId ? "PATCH" : "POST";
    const response = await apiRequest(path, {
      method,
      body: payload
    });

    state.activeResume = hydrateResume(response.data);
    state.activeResumeId = response.data._id;
    showToast("Resume saved.");
    await refreshResumeListOnly();
    renderEditor();
    renderPreview(state.activeResume, els.previewPage);
    return state.activeResume;
  } catch (error) {
    showToast(error.message, "error");
    return null;
  }
}

async function refreshResumeListOnly() {
  const response = await apiRequest("/resumes");
  state.resumes = response.data || [];
  renderResumeList();
}

async function deleteResume(resumeId) {
  const ok = window.confirm("Delete this resume?");

  if (!ok) return;

  try {
    await apiRequest(`/resumes/${resumeId}`, { method: "DELETE" });
    showToast("Resume deleted.");
    await loadResumes();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function shareActiveResume() {
  if (!state.activeResumeId) {
    const saved = await saveActiveResume({ visibility: "shareable" });

    if (!saved) return;
  } else if (state.activeResume.visibility !== "shareable") {
    const saved = await saveActiveResume({ visibility: "shareable" });

    if (!saved) return;
  }

  const shareUrl = `${window.location.origin}${window.location.pathname}?share=${state.activeResumeId}`;

  try {
    await navigator.clipboard.writeText(shareUrl);
    showToast("Share link copied.");
  } catch (error) {
    showToast(shareUrl);
  }
}

async function loadSharedResume(resumeId) {
  showShare();

  try {
    const response = await apiRequest(`/resumes/share/${resumeId}`, { auth: false });
    renderPreview(hydrateResume(response.data), els.sharedPreviewPage);
  } catch (error) {
    els.sharedPreviewPage.innerHTML = `
      <div class="grid min-h-[780px] place-items-center text-center">
        <div>
          <h2 class="text-3xl font-semibold text-neutral-950">Resume not available</h2>
          <p class="mt-3 text-neutral-600">${escapeHtml(error.message)}</p>
        </div>
      </div>
    `;
  }
}

function setAuthMode(mode) {
  state.mode = mode;
  const isLogin = mode === "login";
  els.loginForm.classList.toggle("hidden", !isLogin);
  els.registerForm.classList.toggle("hidden", isLogin);
  els.loginTab.className = tabClass(isLogin);
  els.registerTab.className = tabClass(!isLogin);
}

function showAuth() {
  els.pageTitle.textContent = "Build your resume";
  els.authView.classList.remove("hidden");
  els.appView.classList.add("hidden");
  els.shareView.classList.add("hidden");
  els.sessionBar.innerHTML = "";
  setAuthMode(state.mode);
}

function showApp() {
  els.pageTitle.textContent = "Resume workspace";
  els.authView.classList.add("hidden");
  els.appView.classList.remove("hidden");
  els.shareView.classList.add("hidden");
  renderSessionBar();
}

function showShare() {
  els.pageTitle.textContent = "Shared resume";
  els.authView.classList.add("hidden");
  els.appView.classList.add("hidden");
  els.shareView.classList.remove("hidden");
  renderSessionBar();
}

function renderSessionBar() {
  if (!state.session?.user) {
    els.sessionBar.innerHTML = "";
    return;
  }

  els.sessionBar.innerHTML = `
    <span class="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-700">${escapeHtml(state.session.user.username || state.session.user.email || "User")}</span>
    <button id="logoutBtn" class="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100" type="button">Logout</button>
  `;
  document.querySelector("#logoutBtn").addEventListener("click", logout);
}

function renderResumeList() {
  els.resumeCount.textContent = String(state.resumes.length);

  if (state.resumes.length === 0) {
    els.resumeList.innerHTML = `
      <div class="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-600">
        No resumes yet.
      </div>
    `;
    return;
  }

  els.resumeList.innerHTML = state.resumes
    .map((resume) => {
      const active = resume._id === state.activeResumeId;
      return `
        <div class="rounded-lg border ${active ? "border-emerald-500 bg-emerald-50" : "border-neutral-200 bg-white"} p-3">
          <button class="w-full text-left" type="button" data-select-resume="${resume._id}">
            <span class="block truncate text-sm font-semibold text-neutral-950">${escapeHtml(resume.title || "Untitled Resume")}</span>
            <span class="mt-1 block truncate text-xs text-neutral-600">${escapeHtml(resume.targetRole || "No target role")}</span>
          </button>
          <div class="mt-3 flex gap-2">
            <button class="rounded-md border border-neutral-300 px-2 py-1 text-xs font-semibold text-neutral-700 transition hover:border-emerald-500 hover:text-emerald-700" type="button" data-select-resume="${resume._id}">Edit</button>
            <button class="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50" type="button" data-delete-resume="${resume._id}">Delete</button>
          </div>
        </div>
      `;
    })
    .join("");

  els.resumeList.querySelectorAll("[data-select-resume]").forEach((button) => {
    button.addEventListener("click", () => selectResume(button.dataset.selectResume));
  });

  els.resumeList.querySelectorAll("[data-delete-resume]").forEach((button) => {
    button.addEventListener("click", () => deleteResume(button.dataset.deleteResume));
  });
}

function renderEditor() {
  const resume = hydrateResume(state.activeResume);
  state.activeResume = resume;

  els.editorFields.innerHTML = `
    <section class="border-b border-neutral-200 pb-5">
      <div class="grid gap-4 md:grid-cols-2">
        ${inputField("Resume title", "title", resume.title)}
        ${inputField("Target role", "targetRole", resume.targetRole)}
        <label class="block">
          <span class="text-sm font-medium text-neutral-700">Template</span>
          <select class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none ring-emerald-500 transition focus:ring-2" data-path="template">
            ${option("modern", "Modern", resume.template)}
            ${option("classic", "Classic", resume.template)}
            ${option("compect", "Compact", resume.template)}
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-medium text-neutral-700">Visibility</span>
          <select class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none ring-emerald-500 transition focus:ring-2" data-path="visibility">
            ${option("private", "Private", resume.visibility)}
            ${option("shareable", "Shareable", resume.visibility)}
          </select>
        </label>
      </div>
    </section>

    <section class="border-b border-neutral-200 pb-5">
      <h2 class="mb-4 text-base font-semibold text-neutral-950">Personal info</h2>
      <div class="grid gap-4 md:grid-cols-2">
        ${inputField("Full name", "personalInfo.fullName", resume.personalInfo.fullName)}
        ${inputField("Headline", "personalInfo.headline", resume.personalInfo.headline)}
        ${inputField("Email", "personalInfo.email", resume.personalInfo.email, "email")}
        ${inputField("Phone", "personalInfo.phone", resume.personalInfo.phone)}
        ${inputField("Location", "personalInfo.location", resume.personalInfo.location)}
        ${inputField("Website", "personalInfo.website", resume.personalInfo.website, "url")}
        ${inputField("LinkedIn", "personalInfo.linkedin", resume.personalInfo.linkedin, "url")}
        ${inputField("GitHub", "personalInfo.github", resume.personalInfo.github, "url")}
      </div>
    </section>

    <section class="border-b border-neutral-200 pb-5">
      <label class="block">
        <span class="text-base font-semibold text-neutral-950">Summary</span>
        <textarea class="mt-2 min-h-32 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none ring-emerald-500 transition focus:ring-2" data-path="summary" required>${escapeHtml(resume.summary)}</textarea>
      </label>
    </section>

    ${Object.entries(sectionConfigs).map(([section, config]) => renderArrayEditor(section, config, resume[section])).join("")}
  `;
}

function renderArrayEditor(section, config, list = []) {
  const items = list.length ? list : [{ ...config.empty }];

  return `
    <section class="border-b border-neutral-200 pb-5 last:border-b-0">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h2 class="text-base font-semibold text-neutral-950">${config.title}</h2>
        <button class="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold transition hover:border-emerald-500 hover:text-emerald-700" type="button" data-action="add" data-section="${section}">Add</button>
      </div>
      <div class="space-y-3">
        ${items
          .map(
            (item, index) => `
              <div class="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <div class="grid gap-3 md:grid-cols-2">
                  ${config.fields.map((field) => arrayInputField(section, index, field, item[field.key])).join("")}
                </div>
                <div class="mt-3 flex justify-end">
                  <button class="rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50" type="button" data-action="remove" data-section="${section}" data-index="${index}">Remove</button>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderPreview(resumeInput, target) {
  const resume = hydrateResume(resumeInput);
  const contactItems = [
    resume.personalInfo.email,
    resume.personalInfo.phone,
    resume.personalInfo.location,
    resume.personalInfo.website,
    resume.personalInfo.linkedin,
    resume.personalInfo.github
  ].filter(Boolean);

  const templateClass = {
    modern: "border-t-8 border-emerald-600",
    classic: "border-t-8 border-neutral-900",
    compect: "border-t-8 border-sky-600 text-[0.95rem]"
  }[resume.template || "modern"];

  target.className = `min-h-[980px] rounded-lg border border-neutral-200 bg-white p-8 shadow-sm ${templateClass}`;
  target.innerHTML = `
    <article class="mx-auto max-w-3xl">
      <header class="border-b border-neutral-200 pb-6">
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">${escapeHtml(resume.targetRole || "Target role")}</p>
        <h2 class="mt-2 text-4xl font-semibold leading-tight text-neutral-950">${escapeHtml(resume.personalInfo.fullName || "Your Name")}</h2>
        <p class="mt-2 text-lg text-neutral-700">${escapeHtml(resume.personalInfo.headline || resume.title || "Professional headline")}</p>
        <div class="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-neutral-600">
          ${contactItems.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        </div>
      </header>

      ${previewBlock("Summary", resume.summary ? `<p class="leading-7 text-neutral-700">${escapeHtml(resume.summary)}</p>` : "")}
      ${previewSkills("Skills", resume.skills)}
      ${previewTimeline("Experience", resume.experience, (item) => `
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h4 class="text-base font-semibold text-neutral-950">${escapeHtml(item.role || "Role")}</h4>
          <span class="text-sm text-neutral-500">${escapeHtml([item.startDate, item.endDate].filter(Boolean).join(" - "))}</span>
        </div>
        <p class="text-sm font-medium text-neutral-700">${escapeHtml(item.company || "Company")}</p>
      `)}
      ${previewTimeline("Projects", resume.projects, (item) => `
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h4 class="text-base font-semibold text-neutral-950">${escapeHtml(item.Projectname || "Project")}</h4>
          <span class="text-sm text-neutral-500">${escapeHtml(item.stack || "")}</span>
        </div>
        ${item.link ? `<a class="text-sm font-medium text-sky-700" href="${safeHref(item.link)}" target="_blank" rel="noreferrer">${escapeHtml(item.link)}</a>` : ""}
        ${item.description ? `<p class="resume-wrap-text mt-1 leading-6 text-neutral-700">${escapeHtml(item.description)}</p>` : ""}
      `)}
      ${previewTimeline("Education", resume.education, (item) => `
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h4 class="text-base font-semibold text-neutral-950">${escapeHtml(item.degree || "Degree")}</h4>
          <span class="text-sm text-neutral-500">${escapeHtml(formatYear(item.year))}</span>
        </div>
        <p class="text-sm font-medium text-neutral-700">${escapeHtml(item.institution || "Institution")}${item.cgpa ? `, CGPA ${escapeHtml(String(item.cgpa))}` : ""}</p>
      `)}
      ${previewTimeline("Certifications", resume.certification, (item) => `
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h4 class="text-base font-semibold text-neutral-950">${escapeHtml(item.title || "Certification")}</h4>
          <span class="text-sm text-neutral-500">${escapeHtml(item.date || "")}</span>
        </div>
        <p class="text-sm font-medium text-neutral-700">${escapeHtml(item.issuer || "")}</p>
        ${item.description ? `<p class="resume-wrap-text mt-1 leading-6 text-neutral-700">${escapeHtml(item.description)}</p>` : ""}
      `)}
      ${previewSkills("Languages", resume.languages)}
    </article>
  `;
}

function previewBlock(title, body) {
  if (!body) return "";

  return `
    <section class="mt-6">
      <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">${title}</h3>
      <div class="mt-3">${body}</div>
    </section>
  `;
}

function previewSkills(title, list) {
  const items = cleanList(list);

  if (items.length === 0) return "";

  return previewBlock(
    title,
    `<div class="flex flex-wrap gap-2">${items
      .map((item) => `<span class="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-800">${escapeHtml(item.name)}${item.level ? ` | ${escapeHtml(item.level)}` : ""}</span>`)
      .join("")}</div>`
  );
}

function previewTimeline(title, list, itemTemplate) {
  const items = cleanList(list);

  if (items.length === 0) return "";

  return previewBlock(
    title,
    `<div class="space-y-4">${items.map((item) => `<div>${itemTemplate(item)}</div>`).join("")}</div>`
  );
}

function inputField(label, path, value = "", type = "text") {
  return `
    <label class="block">
      <span class="text-sm font-medium text-neutral-700">${label}</span>
      <input class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none ring-emerald-500 transition focus:ring-2" data-path="${path}" type="${type}" value="${escapeAttribute(value)}" />
    </label>
  `;
}

function arrayInputField(section, index, field, value = "") {
  const common = `class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none ring-emerald-500 transition focus:ring-2" data-section="${section}" data-index="${index}" data-field="${field.key}"`;
  const displayValue = section === "education" && field.key === "year" ? formatYear(value) : value;

  if (field.textarea) {
    return `
      <label class="block md:col-span-2">
        <span class="text-sm font-medium text-neutral-700">${field.label}</span>
        <textarea ${common}>${escapeHtml(displayValue)}</textarea>
      </label>
    `;
  }

  return `
    <label class="block">
      <span class="text-sm font-medium text-neutral-700">${field.label}</span>
      <input ${common} type="${field.type || "text"}" ${field.step ? `step="${field.step}"` : ""} value="${escapeAttribute(displayValue)}" />
    </label>
  `;
}

function option(value, label, selected) {
  return `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`;
}

function tabClass(active) {
  return active
    ? "auth-tab rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
    : "auth-tab rounded-md px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100";
}

async function apiRequest(path, options = {}) {
  const { auth = true, retry = true, body, ...fetchOptions } = options;
  const headers = {
    Accept: "application/json",
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(fetchOptions.headers || {})
  };

  if (auth && state.session?.AccessToken) {
    headers.Authorization = `Bearer ${state.session.AccessToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...fetchOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await readPayload(response);

  if (response.status === 401 && auth && retry && state.session?.RefreshToken) {
    const refreshed = await refreshToken();

    if (refreshed) {
      return apiRequest(path, { ...options, retry: false });
    }
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || response.statusText || "Request failed");
  }

  return payload;
}

async function readPayload(response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (error) {
    return {
      success: response.ok,
      message: text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    };
  }
}

async function refreshToken() {
  try {
    const response = await apiRequest("/users/refresh-token", {
      method: "POST",
      body: { RefreshToken: state.session.RefreshToken },
      auth: false,
      retry: false
    });

    state.session = {
      ...state.session,
      AccessToken: response.data.AccessToken,
      RefreshToken: response.data.RefreshToken
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
    return true;
  } catch (error) {
    localStorage.removeItem(SESSION_KEY);
    state.session = null;
    return false;
  }
}

function saveSession(data) {
  const session = {
    user: data.user,
    AccessToken: data.AccessToken,
    RefreshToken: data.RefreshToken
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch (error) {
    return null;
  }
}

function createBlankResume() {
  return {
    title: "",
    targetRole: "",
    template: "modern",
    personalInfo: { ...defaultPersonalInfo },
    summary: "",
    skills: [{ ...sectionConfigs.skills.empty }],
    education: [{ ...sectionConfigs.education.empty }],
    experience: [{ ...sectionConfigs.experience.empty }],
    certification: [{ ...sectionConfigs.certification.empty }],
    projects: [{ ...sectionConfigs.projects.empty }],
    languages: [{ ...sectionConfigs.languages.empty }],
    visibility: "private"
  };
}

function hydrateResume(resume = {}) {
  return {
    ...createBlankResume(),
    ...resume,
    personalInfo: {
      ...defaultPersonalInfo,
      ...(resume.personalInfo || {})
    },
    skills: ensureList(resume.skills, sectionConfigs.skills.empty),
    education: ensureList(resume.education, sectionConfigs.education.empty),
    experience: ensureList(resume.experience, sectionConfigs.experience.empty),
    certification: ensureList(resume.certification, sectionConfigs.certification.empty),
    projects: ensureList(resume.projects, sectionConfigs.projects.empty),
    languages: ensureList(resume.languages, sectionConfigs.languages.empty)
  };
}

function normalizeResume(resume) {
  const hydrated = hydrateResume(resume);

  return {
    title: cleanText(hydrated.title) || "Untitled Resume",
    targetRole: cleanText(hydrated.targetRole),
    template: hydrated.template || "modern",
    personalInfo: Object.fromEntries(
      Object.entries(hydrated.personalInfo).map(([key, value]) => [key, cleanText(value)])
    ),
    summary: cleanText(hydrated.summary),
    skills: normalizeList(hydrated.skills),
    education: normalizeList(hydrated.education).map((item) => ({
      ...item,
      ...(item.cgpa ? { cgpa: Number(item.cgpa) } : {})
    })),
    experience: normalizeList(hydrated.experience),
    certification: normalizeList(hydrated.certification),
    projects: normalizeList(hydrated.projects),
    languages: normalizeList(hydrated.languages),
    visibility: hydrated.visibility || "private"
  };
}

function normalizeList(list) {
  return cleanList(list).map((item) =>
    Object.fromEntries(
      Object.entries(item)
        .map(([key, value]) => [key, cleanText(value)])
        .filter(([, value]) => value !== "")
    )
  );
}

function cleanList(list = []) {
  return list.filter((item) =>
    Object.entries(item || {}).some(([key, value]) => key !== "_id" && cleanText(value) !== "")
  );
}

function ensureList(list, empty) {
  if (Array.isArray(list) && list.length > 0) {
    return list.map((item) => ({ ...empty, ...item }));
  }

  return [{ ...empty }];
}

function setByPath(target, path, value) {
  const parts = path.split(".");
  let cursor = target;

  parts.slice(0, -1).forEach((part) => {
    cursor[part] = cursor[part] || {};
    cursor = cursor[part];
  });

  cursor[parts.at(-1)] = value;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function safeHref(value) {
  const text = cleanText(value);

  if (/^https?:\/\//i.test(text)) {
    return escapeAttribute(text);
  }

  return escapeAttribute(`https://${text}`);
}

function formatYear(value) {
  const text = cleanText(value);

  if (!text) return "";

  if (/^\d{4}/.test(text)) {
    return text.slice(0, 4);
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : String(date.getFullYear());
}

function showToast(message, type = "success") {
  clearTimeout(state.toastTimer);
  els.toast.textContent = message;
  els.toast.classList.remove("hidden", "border-rose-200", "bg-rose-50", "text-rose-800", "border-emerald-200", "bg-emerald-50", "text-emerald-800");
  els.toast.classList.add(
    ...(type === "error"
      ? ["border-rose-200", "bg-rose-50", "text-rose-800"]
      : ["border-emerald-200", "bg-emerald-50", "text-emerald-800"])
  );
  state.toastTimer = setTimeout(() => els.toast.classList.add("hidden"), 3600);
}
