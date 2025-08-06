const DB_NAME = "RuralLearnDB";
const DB_VERSION = 1;
const STORE_NAME = "resources";

let db;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject("Failed to open database");
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

function addResource(resource) {
  return new Promise((resolve, reject) => {
    if (!sessionStorage.getItem("loggedInUser")) {
      reject("User not authenticated");
      return;
    }

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(resource);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("Failed to add resource");
  });
}

document.getElementById("uploadForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  // Verify user is still logged in
  if (!sessionStorage.getItem("loggedInUser")) {
    alert("Session expired. Please login again.");
    window.location.href = "login.html";
    return;
  }

  try {
    await openDB();

    const title = document.getElementById("title").value.trim();
    const subject = document.getElementById("subject").value;
    const grade = document.getElementById("grade").value;
    const description = document.getElementById("description").value.trim();
    const fileInput = document.getElementById("file");
    const file = fileInput.files[0];

    if (!title || !subject || !grade || !file) {
      alert("Please fill all required fields");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit");
      return;
    }

    const fileData = await readFileAsArrayBuffer(file);

    const resource = {
      title,
      subject,
      grade,
      description,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedBy: sessionStorage.getItem("loggedInUser"),
      uploadDate: new Date().toISOString(),
      fileBlob: new Blob([fileData], { type: file.type }),
    };

    await addResource(resource);
    showSuccessMessage("Resource uploaded successfully!");
    this.reset();
  } catch (err) {
    console.error("Upload error:", err);
    showErrorMessage(`Error: ${err.message || "Failed to upload resource"}`);
  }
});

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

function showSuccessMessage(message) {
  const alertDiv = document.createElement("div");
  alertDiv.className = "alert alert-success mt-3";
  alertDiv.textContent = message;
  
  const form = document.getElementById("uploadForm");
  form.parentNode.insertBefore(alertDiv, form.nextSibling);
  
  setTimeout(() => alertDiv.remove(), 5000);
}

function showErrorMessage(message) {
  const alertDiv = document.createElement("div");
  alertDiv.className = "alert alert-danger mt-3";
  alertDiv.textContent = message;
  
  const form = document.getElementById("uploadForm");
  form.parentNode.insertBefore(alertDiv, form.nextSibling);
  
  setTimeout(() => alertDiv.remove(), 5000);
}

// Initialize the form
document.addEventListener("DOMContentLoaded", () => {
  // Add current user info to the page
  const loggedInUser = sessionStorage.getItem("loggedInUser");
  if (loggedInUser) {
    const userInfo = document.createElement("div");
    userInfo.className = "text-end mb-3";
    userInfo.textContent = `Logged in as: ${loggedInUser}`;
    document.querySelector("main").prepend(userInfo);
  }
});