const supabaseUrl = "https://zymlknlhxlvcnazlmfjj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bWxrbmxoeGx2Y25hemxtZmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NzYxNjgsImV4cCI6MjA4NTQ1MjE2OH0.GipudbsRnZKPCPbhyVFgQlO4jbjwASHr_UniBl3ei3Y";
const client = supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;

// ========== LOGIN ==========
document.getElementById("loginBtn").onclick = async () => {
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google"
  });

  if (error) alert(error.message);
};

// ========== LOGOUT ==========
document.getElementById("logoutBtn").onclick = async () => {
  await client.auth.signOut();
  location.reload();
};

// ========== CHECK USER SESSION ==========
async function checkUser() {
  const { data } = await client.auth.getSession();

  if (data.session) {
    currentUser = data.session.user;
    document.getElementById("loginBtn").style.display = "none";
    document.getElementById("logoutBtn").style.display = "block";
    load(); // load tasks after login
  }
}

checkUser();

// ========== LOAD TASKS ==========
async function load() {
  if (!currentUser) return;

  const date = document.getElementById("datePicker").value;
  if (!date) return;

  const { data, error } = await client
    .from("tasks")
    .select("*")
    .eq("user_id", currentUser.id)
    .eq("date", date);

  const tasks = data.filter(t => !t.completed);
  const completed = data.filter(t => t.completed);

  document.getElementById("taskList").innerHTML = tasks
    .map(
      t => `
      <li>
        <div style="display:flex; gap:10px;">
          <input type="checkbox" onchange="toggle('${t.id}', ${t.completed})">
          <span>${t.text}</span>
        </div>
        <button onclick="delTask('${t.id}')">❌</button>
      </li>
    `
    )
    .join("");

  document.getElementById("completedList").innerHTML = completed
    .map(
      t => `
      <li class="completed">
        <div style="display:flex; gap:10px;">
          <input type="checkbox" checked onchange="toggle('${t.id}', ${t.completed})">
          <span>${t.text}</span>
        </div>
      </li>
    `
    )
    .join("");
}

document.getElementById("datePicker").addEventListener("change", load);

// ========== ADD TASK ==========
async function addTask() {
  if (!currentUser) return alert("Please login first!");

  const text = document.getElementById("taskInput").value;
  const date = document.getElementById("datePicker").value;

  if (!text || !date) return;

  await client.from("tasks").insert([
    {
      text,
      date,
      user_id: currentUser.id
    }
  ]);

  document.getElementById("taskInput").value = "";
  load();
}

// ========== CHECKBOX TOGGLE ==========
async function toggle(id, completed) {
  await client
    .from("tasks")
    .update({ completed: !completed })
    .eq("id", id);

  load();
}

// ========== DELETE ==========
async function delTask(id) {
  await client.from("tasks").delete().eq("id", id);
  load();
}
