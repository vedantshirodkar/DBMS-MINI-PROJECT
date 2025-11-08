import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ---------- Supabase Config ----------
const SUPABASE_URL = "https://oqbzbvkbqzpcuivsahkx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYnpidmticXpwY3VpdnNhaGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MDk2MTMsImV4cCI6MjA3NDE4NTYxM30._bAXsOuz-xPbALqK9X0R5QKNZcwSzKCats3vMTfDGWs";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let userEmail = null;

// ---------- Check Auth ----------
(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("Please log in first!");
    window.location.href = "login.html";
  } else {
    userEmail = user.email;
  }
})();

// ---------- Modal Elements ----------
const modal = document.getElementById("resultModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const closeBtn = document.getElementById("closeModal");

// ---------- Handle Delete ----------
document.getElementById("deleteForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const songName = document.getElementById("songName").value.trim();
  if (!songName) return showModal("Missing Field", "Please enter a song name.");

  try {
    const res = await fetch("/delsongs/deleteSong", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ song_name: songName, regemail: userEmail }),
    });

    const data = await res.json();

    if (res.ok) {
      showModal("Song Deleted", data.message || "The song was deleted successfully.", true);
    } else {
      showModal("Error", data.error || "Failed to delete the song.");
    }
  } catch (err) {
    console.error(err);
    showModal("Server Error", "Unable to connect to the server. Please try again later.");
  }
});

// ---------- Show Modal Function ----------
function showModal(title, message, redirectHome = false) {
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modal.style.display = "flex";

  // Redirect to home if successful after 1.5s
  if (redirectHome) {
    setTimeout(() => {
      modal.style.display = "none";
      window.location.href = "/";
    }, 1500);
  }
}

// ---------- Close Modal ----------
closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});
