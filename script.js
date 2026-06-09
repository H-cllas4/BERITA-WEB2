// 1. Import SDK Firebase yang dibutuhkan (Menggunakan Realtime Database)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 2. KONFIGURASI FIREBASE (Sudah disesuaikan dengan ID Proyekmu: web-berita-3cf99)
// Cek kembali apiKey dan appId milikmu di Firebase Console, lalu sesuaikan jika berbeda.
const firebaseConfig = {
    apiKey: "AIzaSyCcZtFkyOkttOZY-jsU7sS22vr4_AF3H30", 
    authDomain: "web-berita-3cf99.firebaseapp.com",
    databaseURL: "https://web-berita-3cf99-default-rtdb.asia-southeast1.firebasedatabase.app", // URL Database kamu
    projectId: "web-berita-3cf99",
    storageBucket: "web-berita-3cf99.firebasestorage.app",
    messagingSenderId: "235096136702", // Sesuaikan dengan milikmu
    appId: "1:235096136702:web:41ccdcb7dfeef24d9dbeaf" // Sesuaikan dengan milikmu
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 3. MENGAMBIL ELEMEN HTML (DOM)
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const closeBtn = document.querySelector('.close-btn');
const loginForm = document.getElementById('loginForm');
const adminSection = document.getElementById('adminSection');
const newsForm = document.getElementById('newsForm');
const newsList = document.getElementById('newsList');

// Status login admin (Lokal di memori browser)
let isAdminLoggedIn = false; 

// --- 4. LOGIKA LOGIN & LOGOUT ADMIN (PASSWORD: 012012) ---

// Buka modal login saat tombol klik
loginBtn.addEventListener('click', () => loginModal.classList.remove('hidden'));
// Tutup modal login
closeBtn.addEventListener('click', () => loginModal.classList.add('hidden'));

// Proses pengecekan password admin
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const passwordInput = document.getElementById('loginPassword').value;

    // COCOKKAN PASSWORD DI SINI
    if (passwordInput === "012012") {
        isAdminLoggedIn = true;
        loginModal.classList.add('hidden');
        loginForm.reset();
        perbaruiTampilanDanAkses();
    } else {
        alert("Password Admin Salah! Coba lagi.");
    }
});

// Proses logout admin
logoutBtn.addEventListener('click', () => {
    isAdminLoggedIn = false;
    perbaruiTampilanDanAkses();
});

// Fungsi mengubah tampilan tombol & form berdasarkan status login
function perbaruiTampilanDanAkses() {
    if (isAdminLoggedIn) {
        adminSection.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        loginBtn.classList.add('hidden');
    } else {
        adminSection.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        loginBtn.classList.remove('hidden');
    }
    // Render ulang daftar berita agar tombol edit/hapus muncul/hilang
    tampilkanBerita();
}


// --- 5. LOGIKA DATABASE BERITA (FIREBASE REALTIME) ---

// Fungsi Tambah Berita Baru ATAU Simpan Edit Berita Lama
newsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('newsId').value;
    const title = document.getElementById('newsTitle').value;
    const content = document.getElementById('newsContent').value;

    if (id) {
        // Jika ID ada, tandanya sedang mengedit berita lama
        update(ref(db, 'berita/' + id), {
            judul: title,
            isi: content,
            waktu: new Date().toLocaleString('id-ID')
        }).then(() => {
            resetFormBerita();
        });
    } else {
        // Jika ID kosong, tandanya sedang membuat berita baru
        const beritaBaruRef = push(ref(db, 'berita'));
        set(beritaBaruRef, {
            judul: title,
            isi: content,
            waktu: new Date().toLocaleString('id-ID')
        }).then(() => {
            resetFormBerita();
        });
    }
});

// Mengembalikan form ke kondisi kosong semula
function resetFormBerita() {
    newsForm.reset();
    document.getElementById('newsId').value = '';
    document.getElementById('submitNewsBtn').innerText = "Publikasikan";
}

// Mengambil data berita dari Firebase dan menampilkannya ke website secara otomatis (Realtime)
function tampilkanBerita() {
    const beritaRef = ref(db, 'berita');
    onValue(beritaRef, (snapshot) => {
        newsList.innerHTML = '';
        const data = snapshot.val();
        
        if (!data) {
            newsList.innerHTML = '<p>Belum ada berita yang diterbitkan.</p>';
            return;
        }

        // Looping data berita (Berita terbaru ditaruh paling atas)
        Object.keys(data).reverse().forEach(key => {
            const berita = data[key];
            
            const card = document.createElement('div');
            card.className = 'news-card';
            
            let adminButtons = '';
            // Jika login sebagai admin, sisipkan tombol edit & hapus di bawah konten berita
            if (isAdminLoggedIn) {
                adminButtons = `
                    <div class="admin-actions">
                        <button class="edit-btn" data-id="${key}" data-judul="${berita.judul}" data-isi="${berita.isi}">Edit</button>
                        <button class="delete-btn" data-id="${key}">Hapus</button>
                    </div>
                `;
            }

            card.innerHTML = `
                <h3>${berita.judul}</h3>
                <small style="color:#888;">Diposting pada: ${berita.waktu}</small>
                <p style="margin-top:10px;">${berita.isi.replace(/\n/g, '<br>')}</p>
                ${adminButtons}
            `;
            
            newsList.appendChild(card);
        });

        // Hubungkan fungsi klik ke tombol edit/hapus yang baru saja dirender
        koneksikanTombolAdmin();
    });
}

// Fungsi memberikan aksi klik pada tombol edit & hapus admin
function koneksikanTombolAdmin() {
    // Tombol Hapus Berita
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm("Apakah Anda yakin ingin menghapus berita ini?")) {
                remove(ref(db, 'berita/' + id));
            }
        });
    });

    // Tombol Edit Berita (Melempar data berita kembali ke form di atas)
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const judul = e.target.getAttribute('data-judul');
            const isi = e.target.getAttribute('data-isi');

            document.getElementById('newsId').value = id;
            document.getElementById('newsTitle').value = judul;
            document.getElementById('newsContent').value = isi;
            document.getElementById('submitNewsBtn').innerText = "Simpan Perubahan";
            
            // Otomatis scroll ke atas agar admin bisa melihat form pengeditan
            window.scrollTo({top: 0, behavior: 'smooth'});
        });
    });
}

// Menjalankan fungsi memuat data berita saat website pertama kali dibuka
tampilkanBerita();