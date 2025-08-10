// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDN6tU7Ln3JgeFP7jTprAjSgXDfzunDGQI",
  authDomain: "gay-db7b1.firebaseapp.com",
  databaseURL: "https://gay-db7b1-default-rtdb.firebaseio.com",
  projectId: "gay-db7b1",
  storageBucket: "gay-db7b1.appspot.com",
  messagingSenderId: "959507085021",
  appId: "1:959507085021:web:755901093c2c81d0fb4d34",
  measurementId: "G-1900F4D48J"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// DOM elements
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const toggleAuth = document.getElementById("toggle-auth");
const authTitle = document.getElementById("auth-title");

// Toggle between login and register forms
toggleAuth.addEventListener("click", () => {
  loginForm.classList.toggle("hidden");
  registerForm.classList.toggle("hidden");
  authTitle.textContent = loginForm.classList.contains("hidden") ? "Đăng ký" : "Đăng nhập";
  toggleAuth.textContent = loginForm.classList.contains("hidden") ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký";
});

// Register form handler
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("register-username").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  
  auth.createUserWithEmailAndPassword(email, password).then(userCredential => {
    return userCredential.user.updateProfile({ displayName: username });
  }).then(() => {
    document.getElementById("display-name").textContent = auth.currentUser.displayName;
    showChat();
  }).catch(error => alert(error.message));
});

// Login form handler
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  
  auth.signInWithEmailAndPassword(email, password).then(() => {
    document.getElementById("display-name").textContent = auth.currentUser.displayName || auth.currentUser.email;
    showChat();
  }).catch(error => alert(error.message));
});

// Google login handler
document.getElementById("google-login").addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then(() => {
    document.getElementById("display-name").textContent = auth.currentUser.displayName;
    showChat();
  }).catch(error => alert(error.message));
});

// Show chat section
function showChat() {
  document.getElementById("auth-section").classList.add("hidden");
  document.getElementById("chat-section").classList.remove("hidden");
}

// Send message function
function sendMessage() {
  const input = document.getElementById("chat-input");
  const imageInput = document.getElementById("imageInput");
  const videoInput = document.getElementById("videoInput");
  const text = input.value.trim();
  const images = imageInput.files;
  const videos = videoInput.files;
  
  if (!text && images.length === 0 && videos.length === 0) return;

  // Send text message if exists
  if (text) {
    db.ref("messages").push({
      name: auth.currentUser.displayName || auth.currentUser.email,
      text: text,
      uid: auth.currentUser.uid,
      timestamp: Date.now()
    });
  }

  // Send images
  if (images.length > 0) {
    sendImages(images);
  }

  // Send videos
  if (videos.length > 0) {
    sendVideos(videos);
  }

  // Clear inputs
  input.value = "";
  imageInput.value = "";
  videoInput.value = "";
  document.getElementById("mediaPreview").innerHTML = "";
}

// Send images function
async function sendImages(files) {
  for (const file of files) {
    try {
      const base64 = await toBase64(file);
      const imageUrl = await uploadToImgbb(base64);
      if (imageUrl) {
        db.ref("messages").push({
          name: auth.currentUser.displayName || auth.currentUser.email,
          text: "",
          image: imageUrl,
          uid: auth.currentUser.uid,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Lỗi upload ảnh!");
    }
  }
}

// Send videos function
async function sendVideos(files) {
  for (const file of files) {
    try {
      showUploadProgress("Đang upload video...");
      const videoUrl = await uploadVideo(file);
      hideUploadProgress();
      if (videoUrl) {
        db.ref("messages").push({
          name: auth.currentUser.displayName || auth.currentUser.email,
          text: "",
          video: videoUrl,
          uid: auth.currentUser.uid,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      hideUploadProgress();
      console.error("Error uploading video:", error);
      alert("Lỗi upload video!");
    }
  }
}

// Convert file to base64
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Upload image to imgbb
async function uploadToImgbb(base64) {
  const apiKey = "eb64cc8f94a115e3a412694f2a0f10b3";
  const formData = new FormData();
  formData.append("key", apiKey);
  formData.append("image", base64);

  try {
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData
    });
    const result = await response.json();
    return result.data.url;
  } catch (error) {
    console.error("Error uploading to imgbb:", error);
    return null;
  }
}

// Upload video to server
async function uploadVideo(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("http://192.168.1.6:5000/upload", {
      method: "POST",
      body: formData,
    });
    
    const result = await response.json();
    
    // Check if upload was successful
    if (result.status === "success" && result.data && result.data.url) {
      return result.data.url;
    } else {
      console.error("Upload failed:", result);
      return null;
    }
  } catch (error) {
    console.error("Error uploading video:", error);
    return null;
  }
}

// Show upload progress
function showUploadProgress(message) {
  const preview = document.getElementById("mediaPreview");
  preview.innerHTML = `
    <div class="upload-progress">
      <div class="upload-progress-bar" style="width: 100%">${message}</div>
    </div>
  `;
}

// Hide upload progress
function hideUploadProgress() {
  document.getElementById("mediaPreview").innerHTML = "";
}

// Preview selected images
document.getElementById("imageInput").addEventListener("change", function() {
  const files = this.files;
  const preview = document.getElementById("mediaPreview");
  preview.innerHTML = "";
  
  for (const file of files) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = document.createElement("img");
      img.src = reader.result;
      img.title = file.name;
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
});

// Preview selected videos
document.getElementById("videoInput").addEventListener("change", function() {
  const files = this.files;
  const preview = document.getElementById("mediaPreview");
  preview.innerHTML = "";
  
  for (const file of files) {
    const reader = new FileReader();
    reader.onload = () => {
      const video = document.createElement("video");
      video.src = reader.result;
      video.title = file.name;
      video.controls = true;
      video.muted = true;
      preview.appendChild(video);
    };
    reader.readAsDataURL(file);
  }
});

// Allow Enter key to send message
document.getElementById("chat-input").addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

// Listen for new messages
const chatBox = document.getElementById("chat-box");
db.ref("messages").on("child_added", snapshot => {
  const msg = snapshot.val();
  const div = document.createElement("div");
  div.className = "message " + (msg.uid === auth.currentUser?.uid ? "mine" : "other");
  
  let content = `<strong>${msg.name}:</strong><br>`;
  
  // Add text if exists
  if (msg.text) {
    content += `<span>${msg.text}</span>`;
  }
  
  // Add image if exists
  if (msg.image) {
    content += `<br><a href="${msg.image}" target="_blank">
      <img src="${msg.image}" alt="Image" />
    </a>`;
  }
  
  // Add video if exists
  if (msg.video) {
    content += `<br><video controls>
      <source src="${msg.video}" type="video/mp4">
      <source src="${msg.video}" type="video/webm">
      Your browser does not support the video tag.
    </video>`;
  }
  
  div.innerHTML = content;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});
