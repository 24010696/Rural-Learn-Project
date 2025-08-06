const DB_NAME = "RuralLearnDB";
const DB_VERSION = 1;
const STORE_NAME = "resources";

let db;
let resources = [];

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject("Failed to open DB");
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

function getAllResources() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("Failed to get resources");
  });
}

function deleteResourceById(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject("Failed to delete resource");
  });
}

async function loadResources() {
  await openDB();
  resources = await getAllResources();
  filterResources();
}

function renderResources(data) {
  const resourceList = document.getElementById("resourceList");
  resourceList.innerHTML = "";

  if (data.length === 0) {
    resourceList.innerHTML = "<li class='list-group-item'>No matching resources found.</li>";
    return;
  }

  data.forEach((res) => {
    const item = document.createElement("li");
    item.className = "list-group-item d-flex justify-content-between align-items-center";

    item.innerHTML = `
      <div>
        <h5>${res.title} (${res.subject} - Grade ${res.grade})</h5>
        <p>${res.description || ""}</p>
      </div>
      <div>
        <button class="btn btn-primary btn-sm me-2" onclick="downloadFile(${res.id})">Download</button>
        ${sessionStorage.getItem("loggedInUser") ? 
          `<button class="btn btn-danger btn-sm" onclick="deleteResource(${res.id})">Delete</button>` 
          : ""}
      </div>
    `;

    resourceList.appendChild(item);
  });
}

function filterResources() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const selectedSubject = document.getElementById("subjectFilter").value;
  const selectedGrade = document.getElementById("gradeFilter").value;

  const filtered = resources.filter(res =>
    res.title.toLowerCase().includes(searchTerm) &&
    (selectedSubject === "" || res.subject === selectedSubject) &&
    (selectedGrade === "" || res.grade === selectedGrade)
  );

  renderResources(filtered);
}

async function deleteResource(id) {
  if (!sessionStorage.getItem("loggedInUser")) {
    alert("You must be logged in to delete resources.");
    return;
  }
  
  if (confirm("Are you sure you want to delete this resource?")) {
    await deleteResourceById(id);
    await loadResources();
  }
}

function downloadFile(id) {
  const resource = resources.find(r => r.id === id);
  if (!resource) {
    alert("File not found");
    return;
  }
  const url = URL.createObjectURL(resource.fileBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = resource.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("searchInput").addEventListener("input", filterResources);
  document.getElementById("subjectFilter").addEventListener("change", filterResources);
  document.getElementById("gradeFilter").addEventListener("change", filterResources);
  loadResources();
});