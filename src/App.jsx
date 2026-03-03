import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Home, UserPlus, Database, Edit, 
  Eye, BookOpen, Plus, Award, Printer, Search, 
  Smartphone, Globe, Mail, MapPin, User, ChevronLeft, ArrowRight,
  Phone, Users, CheckCircle, FileCheck, Download, 
  CloudUpload, FileText, Camera
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, addDoc, updateDoc } from 'firebase/firestore';

// ==========================================
// 1. ASSET & KONFIGURASI (STABIL)
// ==========================================

const LOGO_UTAMA = "./logo.png"; 
const LOGO_WA = "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg";

const IKON_GENDER = {
  "Laki-laki": "https://cdn-icons-png.flaticon.com/512/4128/4128176.png",
  "Perempuan": "https://cdn-icons-png.flaticon.com/512/4128/4128171.png"
};

const PROGRAM_ASSETS = {
  "Microsoft Office": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=400",
  "Desain Grafis": "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=400",
  "Corel Draw": "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=400",
  "Photoshop": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400",
  "Teknisi Komputer": "https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=400",
  "Web Programming": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400",
  "Digital Marketing": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400",
  "Default": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400"
};

const getProgramThumb = (name) => {
  if (name.includes("Microsoft Office")) return PROGRAM_ASSETS["Microsoft Office"];
  if (name.includes("Desain Grafis")) return PROGRAM_ASSETS["Desain Grafis"];
  if (name.includes("Corel Draw")) return PROGRAM_ASSETS["Corel Draw"];
  if (name.includes("Photoshop")) return PROGRAM_ASSETS["Photoshop"];
  if (name.includes("Teknisi Komputer")) return PROGRAM_ASSETS["Teknisi Komputer"];
  if (name.includes("Web Programming")) return PROGRAM_ASSETS["Web Programming"];
  if (name.includes("Digital Marketing")) return PROGRAM_ASSETS["Digital Marketing"];
  return PROGRAM_ASSETS["Default"];
};

const DAFTAR_AGAMA = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"];
const JAM_BELAJAR_OPTIONS = ["16.00 - 17.30", "18.30 - 20.00 (belum dibuka)"];

const PROGRAM_CHOICES = [
  "Microsoft Office Basic (12x Pertemuan)",
  "Microsoft Office Expert (36x Pertemuan)",
  "Microsoft Office Word (18x Pertemuan)",
  "Microsoft Office Excel (20x Pertemuan)",
  "Microsoft Office PowerPoint (6x Pertemuan)",
  "Desain Grafis (24x Pertemuan)",
  "Corel Draw (17x Pertemuan)",
  "Photoshop (7x Pertemuan)",
  "Teknisi Komputer dan Jaringan (18x Pertemuan)",
  "Web Programming (24x Pertemuan)",
  "Digital Marketing Level 1 (Personal) (12x Pertemuan)",
  "Digital Marketing Level 2 (Corporate) (16x Pertemuan)"
];

const MATERI_OTOMATIS = {
  "Microsoft Office Basic (12x Pertemuan)": ["Windows Manajemen", "MS. Word Basic", "MS. Excel Basic", "MS. PowerPoint Basic"],
  "Microsoft Office Expert (36x Pertemuan)": ["Windows Manajemen", "MS. Word Expert", "MS. Excel Expert", "MS. PowerPoint Expert", "Tugas Akhir"],
  "Desain Grafis (24x Pertemuan)": ["Windows Manajemen", "CorelDraw", "Photoshop"],
};

const MATERI_DEFAULT_FALLBACK = ["Windows Manajemen", "Materi Kompetensi Utama", "Project Akhir"];

const EnterLogo = ({ size = "w-14 h-14" }) => {
  if (LOGO_UTAMA) {
    return <img src={LOGO_UTAMA} alt="Logo" className={`${size} object-contain flex-shrink-0 transition-transform hover:scale-105 duration-300`} />;
  }
  return (
    <div className={`${size} bg-red-600 rounded-full flex items-center justify-center border-4 border-slate-50 shadow-lg flex-shrink-0 transition-transform hover:scale-105 duration-300`}>
      <span className="text-white font-black text-2xl leading-none italic select-none">e</span>
    </div>
  );
};

// ==========================================
// 2. LOGIKA PERHITUNGAN
// ==========================================
const hitungTotal = (nilaiArray) => nilaiArray ? nilaiArray.reduce((total, item) => total + (Number(item.skor) || 0), 0) : 0;
const hitungRataRata = (nilaiArray) => (nilaiArray && nilaiArray.length > 0) ? (hitungTotal(nilaiArray) / nilaiArray.length).toFixed(1) : 0;
const getKeterangan = (rataRata) => {
  const n = Number(rataRata);
  if (n === 0) return '-';
  if (n < 50) return 'KURANG';
  if (n <= 75) return 'CUKUP';
  if (n <= 85) return 'BAIK';
  return 'SANGAT BAIK';
};

// ==========================================
// 3. FIREBASE SETUP
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCxjm6oTLmAZPFnoxsQpDr4CjYsTxYgiKQ",
  authDomain: "database-shortcourse.firebaseapp.com",
  projectId: "database-shortcourse",
  storageBucket: "database-shortcourse.firebasestorage.app",
  messagingSenderId: "861625929338",
  appId: "1:861625929338:web:d5111f6422745154ad35c3",
  measurementId: "G-QN8YEE07DY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'database-shortcourse-enter';

// Data bawaan untuk Mode Offline
const MOCK_PARTICIPANTS = [
  { 
    id: 1, nik: '3201010101010001', nama: 'BUDI SANTOSO', email: 'budi@example.com', telepon: '081234567890', 
    tempatLahir: 'Jakarta', tanggalLahir: '1995-01-10', gender: 'Laki-laki', agama: 'Islam', alamat: 'JL. SUDIRMAN NO. 12, JAKARTA', 
    program: 'Microsoft Office Basic (12x Pertemuan)', category: 'Reguler', status: 'Aktif', 
    jamBelajar: '16.00 - 17.30', tanggalMulaiBelajar: '2024-01-10', tanggalSelesaiBelajar: '', photo: null, tanggalDaftar: '10/01/2024',
    nilai: []
  }
];
const MOCK_CERTS = [
  { id: 101, namaSiswa: 'SITI AMINAH', noSertifikat: 'ENT/2026/001', program: 'Desain Grafis (24x Pertemuan)', fileUrl: '#', fileName: 'Sertifikat_Siti.pdf', uploadDate: '28/02/2026' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [message, setMessage] = useState(null);
  const [dbCategory, setDbCategory] = useState("Reguler"); 
  const [selectedCourse, setSelectedCourse] = useState(null); 
  const [selectedGradCourse, setSelectedGradCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // State Data (Tahan Banting - Bisa Mode Online/Offline)
  const [certificates, setCertificates] = useState(MOCK_CERTS);
  const [participants, setParticipants] = useState(MOCK_PARTICIPANTS);

  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNilaiModalOpen, setIsNilaiModalOpen] = useState(false);
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [tempNilai, setTempNilai] = useState([]);
  const [tempPhoto, setTempPhoto] = useState(null);

  // Inisialisasi Auth Firebase Anti-Crash
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Info: Firebase Auth gagal, pindah ke Mode Lokal.", err);
        // Notifikasi ramah jika belum di-set di Firebase Console
        if (err?.message?.includes("auth/configuration-not-found") || err?.message?.includes("admin-restricted-operation")) {
           setMessage("Info: Aktifkan mode 'Anonymous' di menu Authentication Firebase agar data tersimpan ke Cloud.");
           setTimeout(() => setMessage(null), 8000);
        }
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
       if (u) setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Data dari Firestore (Real-time) - Hanya jika Online
  useEffect(() => {
    if (!user) return;
    
    const participantsRef = collection(db, 'artifacts', appId, 'public', 'data', 'participants');
    const unsubParticipants = onSnapshot(participantsRef, (snapshot) => {
      if (!snapshot.empty) {
         const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         setParticipants(data.reverse()); 
      }
    }, (error) => console.error("Error ambil data peserta:", error));

    const certsRef = collection(db, 'artifacts', appId, 'public', 'data', 'certificates');
    const unsubCerts = onSnapshot(certsRef, (snapshot) => {
      if (!snapshot.empty) {
         const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         setCertificates(data.reverse());
      }
    }, (error) => console.error("Error ambil data sertifikat:", error));

    return () => {
      unsubParticipants();
      unsubCerts();
    };
  }, [user]);

  const handleNavigation = (tab) => { 
    setActiveTab(tab); 
    setIsMenuOpen(false); 
    setSelectedCourse(null);
    setSelectedGradCourse(null);
    setIsDetailModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedParticipant(null);
    setSearchQuery("");
  };

  const showNotification = (msg) => { setMessage(msg); setTimeout(() => setMessage(null), 3000); };

  const handleAddParticipant = async (data) => {
    const newParticipant = { 
      ...data, 
      tanggalDaftar: new Date().toLocaleDateString('id-ID'), 
      status: 'Aktif', 
      nilai: [], 
      photo: null, 
      tanggalSelesaiBelajar: '' 
    };

    if (!user) {
       // Mode Offline / Lokal
       setParticipants([{ id: Date.now(), ...newParticipant }, ...participants]);
       showNotification("Registrasi Berhasil (Mode Offline)!");
       setActiveTab('database');
       return;
    }

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'participants'), newParticipant);
      showNotification("Registrasi Berhasil Tersimpan!");
      setActiveTab('database');
    } catch (e) {
      console.error("Error menambah data:", e);
      showNotification("Gagal menyimpan data ke Cloud.");
    }
  };

  const handleUploadCert = async (e) => {
    e.preventDefault();
    
    const fd = new FormData(e.target);
    const file = fd.get('file');
    
    let fileDataUrl = '#';
    if (file && file.size > 0) {
       const reader = new FileReader();
       reader.readAsDataURL(file);
       await new Promise(resolve => reader.onloadend = resolve);
       fileDataUrl = reader.result; 
    }

    const newCert = {
      namaSiswa: fd.get('namaSiswa').toUpperCase(),
      noSertifikat: fd.get('noSertifikat').toUpperCase(),
      program: fd.get('program'),
      fileName: file ? file.name : 'Unknown',
      fileUrl: fileDataUrl,
      uploadDate: new Date().toLocaleDateString('id-ID')
    };

    if (!user) {
       // Mode Offline
       setCertificates([{ id: Date.now(), ...newCert }, ...certificates]);
       setIsUploadModalOpen(false);
       showNotification("Sertifikat Tersimpan (Mode Offline)!");
       return;
    }

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'certificates'), newCert);
      setIsUploadModalOpen(false);
      showNotification("Backup Sertifikat Tersimpan Aman di Cloud!");
    } catch (e) {
      console.error(e);
      showNotification("Gagal upload sertifikat (Ukuran mungkin terlalu besar).");
    }
  };

  const handleOpenDetail = (p) => {
    setSelectedParticipant(p);
    setIsDetailModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setSelectedParticipant(p);
    setTempPhoto(p.photo);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedParticipant) return;
    
    const fd = new FormData(e.target);
    
    if (!user || !selectedParticipant.id.toString().includes("-")) {
       // Mode Offline
       setParticipants(participants.map(p => p.id === selectedParticipant.id ? {
          ...p, tanggalSelesaiBelajar: fd.get('tanggalSelesaiBelajar'), status: fd.get('status'), photo: tempPhoto
       } : p));
       setIsEditModalOpen(false);
       showNotification("Data Berhasil Diperbarui (Mode Offline)!");
       return;
    }

    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'participants', selectedParticipant.id);

    try {
      await updateDoc(docRef, {
        tanggalSelesaiBelajar: fd.get('tanggalSelesaiBelajar'),
        status: fd.get('status'),
        photo: tempPhoto 
      });
      setIsEditModalOpen(false);
      showNotification("Data Berhasil Diperbarui di Database!");
    } catch (err) {
      console.error(err);
      showNotification("Gagal memperbarui data.");
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
         setTempPhoto(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenNilai = (p) => {
    setSelectedParticipant(p);
    if (p.nilai && p.nilai.length > 0) {
       setTempNilai(p.nilai);
    } else {
       const materiList = MATERI_OTOMATIS[p.program] || MATERI_DEFAULT_FALLBACK;
       setTempNilai(materiList.map(m => ({ materi: m, skor: '' })));
    }
    setIsNilaiModalOpen(true);
  };

  const handleSaveNilai = async (e) => {
    e.preventDefault();
    if(!selectedParticipant) return;
    const today = new Date();

    if (!user || !selectedParticipant.id.toString().includes("-")) {
       // Mode Offline
       setParticipants(participants.map(p => p.id === selectedParticipant.id ? { 
         ...p, nilai: tempNilai, status: 'Lulus', tanggalKeluar: today.toLocaleDateString('id-ID')
       } : p));
       setIsNilaiModalOpen(false);
       showNotification("Siswa Dinyatakan Lulus (Mode Offline)!");
       return;
    }
    
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'participants', selectedParticipant.id);

    try {
      await updateDoc(docRef, {
        nilai: tempNilai,
        status: 'Lulus',
        tanggalKeluar: today.toLocaleDateString('id-ID')
      });
      setIsNilaiModalOpen(false);
      showNotification("Siswa Dinyatakan Lulus & Nilai Disimpan!");
    } catch (err) {
      console.error(err);
      showNotification("Gagal menyimpan nilai.");
    }
  };

  const handleDirectPrint = (p) => {
    setSelectedParticipant(p);
    setTimeout(() => { window.print(); }, 400);
  };

  const handlePrintGlobalReport = () => {
    setSelectedParticipant(null);
    setTimeout(() => { window.print(); }, 400);
  };

  const graduatedParticipants = participants.filter(p => p.status === 'Lulus');

  return (
    <>
      <div className="print:hidden min-h-screen bg-slate-50 text-slate-900 font-sans leading-none text-left">
        
        {/* --- NOTIFIKASI TOAST --- */}
        {message && (
          <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-[9999] animate-in slide-in-from-top-10 fade-in duration-500">
             <div className="bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl font-black text-sm flex items-center gap-3 border border-slate-700 max-w-2xl text-center leading-normal">
                <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                {message}
             </div>
          </div>
        )}

        {/* --- HEADER (LOCATION INCLUDED) --- */}
        <nav className="bg-white/95 backdrop-blur-md px-10 h-28 flex justify-between items-center sticky top-0 z-[100] border-b border-slate-200 shadow-sm leading-none">
          <div className="flex items-center gap-6 cursor-pointer group" onClick={() => setActiveTab('home')}>
             <EnterLogo size="w-16 h-16" />
             <div className="h-10 w-[1px] bg-slate-200 hidden md:block"></div>
             <div className="flex flex-col leading-tight">
                <span className="text-2xl font-black text-slate-800 uppercase tracking-tighter group-hover:text-red-600 transition-colors">SHORTCOURSE ENTER</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-1 text-left">Pusat Pelatihan Teknologi</span>
             </div>
          </div>

          <div className="hidden lg:flex items-stretch gap-5 text-left h-16">
             {/* Call Center */}
             <div className="flex items-center gap-4 bg-white px-5 rounded-[1.25rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-md transition-shadow text-black shrink-0">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-red-200 shrink-0">
                   <Phone size={18} />
                </div>
                <div className="flex flex-col justify-center">
                   <span className="text-red-600 font-black text-[9px] uppercase tracking-wider mb-1">Call Center</span>
                   <span className="text-slate-900 text-[11px] font-black leading-none mb-1">0821 5050 9000</span>
                   <span className="text-slate-900 text-[11px] font-black leading-none">0821 5050 9002</span>
                </div>
             </div>
             
             {/* Konsultasi */}
             <div className="flex items-center gap-4 bg-white px-5 rounded-[1.25rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-md transition-shadow text-black shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0">
                   <Mail size={18} />
                </div>
                <div className="flex flex-col justify-center">
                   <span className="text-blue-600 font-black text-[9px] uppercase tracking-wider mb-1">Konsultasi</span>
                   <span className="text-slate-900 text-[11px] font-black lowercase leading-none">e.serverenter@gmail.com</span>
                </div>
             </div>

             {/* Lokasi */}
             <div className="flex items-center gap-4 bg-white px-5 rounded-[1.25rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-md transition-shadow text-black max-w-[280px]">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-200 shrink-0">
                   <MapPin size={18} />
                </div>
                <div className="flex flex-col justify-center">
                   <span className="text-emerald-600 font-black text-[9px] uppercase tracking-wider mb-1">Lokasi</span>
                   <span className="text-slate-900 text-[9px] font-black uppercase leading-[1.4] line-clamp-2" title="JL. P. DIPONEGORO, KAB. KOTAWARINGIN BARAT, KEC. ARUT SELATAN, KALIMANTAN TENGAH">
                      JL. P. DIPONEGORO, KAB. KOTAWARINGIN BARAT, KEC. ARUT SELATAN, KALIMANTAN TENGAH
                   </span>
                </div>
             </div>

             <button onClick={() => setIsMenuOpen(true)} className="w-16 bg-slate-900 text-white rounded-[1.25rem] hover:bg-red-600 transition-all shadow-xl ml-2 flex items-center justify-center shrink-0">
                <Menu />
             </button>
          </div>
          <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-white"><Menu /></button>
        </nav>

        {/* SIDEBAR */}
        <div className={`fixed inset-y-0 right-0 z-[200] w-85 bg-white shadow-2xl transform transition-transform duration-500 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-10 flex justify-between items-center border-b border-slate-50 text-left">
            <div className="flex flex-col text-left">
               <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">NAVIGASI SISTEM</h2>
               <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-2">Enter Training Center</p>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="p-3 bg-slate-50 hover:bg-red-600 hover:text-white transition-all rounded-2xl flex items-center justify-center text-slate-400"><X size={24} /></button>
          </div>
          <div className="px-8 py-10 space-y-6 text-left">
            {[
              { id: 'home', label: 'Dashboard Utama', icon: <Home />, color: 'bg-indigo-500' },
              { id: 'form', label: 'Registrasi Baru', icon: <UserPlus />, color: 'bg-pink-500' },
              { id: 'database', label: 'Database Siswa', icon: <Database />, color: 'bg-blue-500' },
              { id: 'input_nilai', label: 'Penilaian Akademik', icon: <Edit />, color: 'bg-green-500' },
              { id: 'certificates', label: 'Archive Sertifikat', icon: <FileCheck />, color: 'bg-amber-500' }
            ].map(item => (
              <button key={item.id} onClick={() => handleNavigation(item.id)} className={`w-full flex items-center space-x-6 p-6 rounded-[2.5rem] transition-all ${activeTab === item.id ? 'bg-slate-100 text-blue-600 shadow-inner' : 'hover:bg-slate-50 text-slate-600 hover:translate-x-2'}`}>
                <div className={`${item.color} p-3 rounded-2xl text-white shadow-lg`}>{item.icon}</div>
                <span className="font-black uppercase text-xs tracking-widest leading-none text-left">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
        {isMenuOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[4px] z-[150]" onClick={() => setIsMenuOpen(false)} />}

        {/* MAIN CONTENT AREA */}
        <main className="max-w-7xl mx-auto py-16 px-10 leading-none">
          
          {/* TAB HOME */}
          {activeTab === 'home' && (
            <div className="animate-in fade-in duration-700 text-left">
              <div className="flex flex-col md:flex-row justify-between items-center mb-20 gap-10">
                <div className="text-left">
                  <h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase leading-tight mb-4">
                    Halo, <span className="text-red-600">Administrator</span>
                  </h1>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-xs">Pusat Manajemen Data SHORTCOURSE ENTER</p>
                </div>
                
                <div className="flex gap-6">
                  <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center w-48 transition-transform hover:-translate-y-2 leading-none text-center">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><Users /></div>
                    <span className="text-4xl font-black text-slate-800">{participants.filter(p => p.status === 'Aktif').length}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase mt-2">Siswa Aktif</span>
                  </div>
                  <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center w-48 transition-transform hover:-translate-y-2 leading-none text-center">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4"><CheckCircle /></div>
                    <span className="text-4xl font-black text-slate-800">{participants.filter(p => p.status === 'Lulus').length}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase mt-2">Lulusan</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-left">
                {[
                  { label: 'Registrasi', icon: <UserPlus />, color: 'bg-orange-500', tab: 'form', desc: 'Siswa Baru' },
                  { label: 'Database', icon: <Database />, color: 'bg-pink-500', tab: 'database', desc: 'Data Master' },
                  { label: 'Penilaian', icon: <Edit />, color: 'bg-blue-500', tab: 'input_nilai', desc: 'Skor & Hasil' },
                  { label: 'Sertifikat', icon: <FileCheck />, color: 'bg-amber-500', tab: 'certificates', desc: 'Arsip PDF' },
                  { label: 'Website', icon: <Globe />, color: 'bg-green-500', desc: 'Enter Group' }
                ].map((btn, i) => (
                  <div key={i} onClick={() => btn.tab && handleNavigation(btn.tab)} className="group bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer flex flex-col items-center text-center leading-none">
                    <div className={`${btn.color} p-6 rounded-[2.5rem] text-white shadow-xl group-hover:scale-110 mb-6 leading-none`}>{btn.icon}</div>
                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2 leading-none">{btn.label}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{btn.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB FORM */}
          {activeTab === 'form' && (
            <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500 text-left">
              <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden text-left leading-none">
                <div className="bg-slate-900 p-12 text-white flex justify-between items-center leading-none text-white">
                  <div>
                     <h2 className="text-3xl font-black uppercase tracking-tighter leading-none text-white">Registrasi</h2>
                     <p className="text-slate-400 text-[11px] font-bold uppercase mt-3 tracking-widest leading-none text-slate-400">Pendaftaran Siswa Kursus Baru</p>
                  </div>
                  <UserPlus className="w-14 h-14 text-red-600" />
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); handleAddParticipant(Object.fromEntries(new FormData(e.target))); e.target.reset(); }} className="p-12 leading-none text-left">
                  
                  {/* Row 1: NIK & Nama */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left leading-none mb-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">NIK</label>
                       <input name="nik" required type="number" placeholder="Nomor Induk Kependudukan" className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-red-100 font-bold leading-none text-black" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Nama Lengkap</label>
                       <input name="nama" required type="text" placeholder="Sesuai KTP" className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-red-100 font-bold uppercase leading-none text-black" />
                    </div>
                  </div>

                  {/* Row 2: Tempat & Tanggal Lahir */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left leading-none mb-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Tempat Lahir</label>
                       <input name="tempatLahir" required type="text" placeholder="Kota Kelahiran" className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-red-100 font-bold leading-none text-black" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Tanggal Lahir</label>
                       <input name="tanggalLahir" required type="date" className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-red-100 font-bold leading-none text-black" />
                    </div>
                  </div>

                  {/* Row 3: Gender & Agama */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left leading-none mb-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Jenis Kelamin</label>
                       <select name="gender" required className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold bg-white outline-none leading-none text-black">
                          <option value="">-- Pilih Jenis Kelamin --</option>
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Agama</label>
                       <select name="agama" required className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold bg-white outline-none leading-none text-black">
                          <option value="">-- Pilih Agama --</option>
                          {DAFTAR_AGAMA.map(a => <option key={a} value={a}>{a}</option>)}
                       </select>
                    </div>
                  </div>

                  {/* Row 4: Telepon & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left leading-none mb-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Telepon / Whatsapp</label>
                       <input name="telepon" required type="number" placeholder="08..." className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-red-100 font-bold text-black" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Email</label>
                       <input name="email" required type="email" placeholder="email@contoh.com" className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-red-100 font-bold text-black" />
                    </div>
                  </div>

                  {/* Row 5: Alamat (Full Width) */}
                  <div className="space-y-3 mb-8">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Alamat Lengkap</label>
                     <textarea name="alamat" required rows="3" placeholder="Jalan, RT/RW, Desa/Kelurahan..." className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-red-100 font-bold text-black resize-none"></textarea>
                  </div>

                  <hr className="my-10 border-slate-100" />

                  {/* Row 6: Program & Kategori */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left leading-none mb-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Program Kursus</label>
                       <select name="program" required className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold bg-white outline-none leading-none text-black">
                          <option value="">-- Pilih Jurusan --</option>
                          {PROGRAM_CHOICES.map(p => <option key={p} value={p}>{p}</option>)}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Kategori Kelas</label>
                       <select name="category" required className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold bg-white outline-none leading-none text-black">
                          <option value="">-- Pilih Kategori --</option>
                          <option value="Reguler">Reguler</option>
                          <option value="Private">Private</option>
                       </select>
                    </div>
                  </div>

                  {/* Row 7: Jam Belajar & Tanggal Mulai */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left leading-none mb-12">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Jam Belajar</label>
                       <select name="jamBelajar" required className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold bg-white outline-none leading-none text-black">
                          <option value="">-- Pilih Jam --</option>
                          {JAM_BELAJAR_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Tanggal Mulai</label>
                       <input name="tanggalMulaiBelajar" required type="date" className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold outline-none text-black" />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-7 bg-red-600 text-white font-black rounded-[2.5rem] shadow-2xl hover:bg-red-700 transition-all uppercase tracking-widest text-[11px] leading-none text-center">Hantar Pendaftaran</button>
                </form>
              </div>
            </div>
          )}

          {/* TAB DATABASE (LIST KONTAK & STATUS) */}
          {activeTab === 'database' && (
            <div className="animate-in fade-in duration-700 relative text-left leading-none text-left">
              {!selectedCourse ? (
                <div className="space-y-12 leading-none text-left">
                  {/* --- AREA PENCARIAN GLOBAL DATABASE (KEMBALI) --- */}
                  <div className="flex flex-col lg:flex-row justify-between items-center gap-8 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 text-left">
                    <div className="text-left leading-none">
                      <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-3">Master Database</h2>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">Cari Siswa atau Pilih Program</p>
                    </div>
                    <div className="relative w-full lg:w-[400px]">
                       <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                       <input
                         type="text"
                         placeholder="Pencarian Global Siswa..."
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                       />
                    </div>
                  </div>

                  {searchQuery ? (
                    /* HASIL PENCARIAN GLOBAL */
                    <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500 text-left leading-none">
                      <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                        <span className="font-black text-slate-600 uppercase tracking-widest text-[11px]">Hasil Pencarian: "{searchQuery}"</span>
                        <button onClick={() => setSearchQuery("")} className="px-5 py-2.5 bg-red-100 text-red-600 rounded-full font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-colors">Tutup Pencarian</button>
                      </div>
                      <div className="overflow-x-auto text-left leading-none">
                        <table className="w-full text-left font-sans leading-none">
                          <thead className="bg-white border-b border-slate-50 font-black text-[11px] uppercase text-slate-400 tracking-widest leading-none">
                            <tr>
                              <th className="p-10 w-20 text-slate-400">No</th>
                              <th className="p-10 text-slate-400">Peserta & Kontak</th>
                              <th className="p-10 text-slate-400">Program & Status</th>
                              <th className="p-10 text-center w-32 text-slate-400">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 leading-none">
                            {participants.filter(p => p.nama.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                              participants.filter(p => p.nama.toLowerCase().includes(searchQuery.toLowerCase())).map((p, i) => (
                                 <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => handleOpenDetail(p)}>
                                    <td className="p-10 text-slate-300 font-bold font-mono">{i + 1}</td>
                                    <td className="p-10 flex items-center gap-6">
                                      <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                        {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : <img src={IKON_GENDER[p.gender]} className="w-8 h-8 opacity-30" />}
                                      </div>
                                      <div className="flex flex-col gap-3">
                                         <div className="flex items-center gap-3">
                                            <span className="text-base font-black uppercase text-slate-800">{p.nama}</span>
                                         </div>
                                         <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                                            <span className="flex items-center gap-2"><img src={LOGO_WA} className="w-3 h-3" />{p.telepon}</span>
                                         </div>
                                      </div>
                                    </td>
                                    <td className="p-10">
                                      <div className="flex flex-col gap-2">
                                         <span className="font-black text-xs text-slate-800 uppercase">{p.program}</span>
                                         <div className="flex gap-2">
                                           <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase bg-slate-100 px-3 py-1 rounded-full">{p.category}</span>
                                           <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${p.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : p.status === 'Lulus' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>{p.status}</span>
                                         </div>
                                      </div>
                                    </td>
                                    <td className="p-10 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(p); }} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition"><Edit size={16} /></button>
                                      </div>
                                    </td>
                                 </tr>
                              ))
                            ) : (
                              <tr><td colSpan="4" className="p-20 text-center font-black text-slate-300 uppercase tracking-widest text-xs">Siswa Tidak Ditemukan</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 leading-none">
                      {PROGRAM_CHOICES.map((course, idx) => {
                        const count = participants.filter(p => p.program === course).length;
                        return (
                          <div key={idx} onClick={() => setSelectedCourse(course)} className="group bg-white rounded-[4rem] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer border border-slate-100 flex flex-col h-80 relative">
                            <div className="absolute inset-0 z-0">
                               <img src={getProgramThumb(course)} alt={course} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                               <div className="absolute inset-0 bg-slate-900/60 group-hover:bg-slate-900/40 transition-colors" />
                            </div>
                            <div className="relative z-10 p-8 flex justify-between items-start leading-none text-black">
                               <div className="bg-white/10 backdrop-blur-xl p-4 rounded-3xl border border-white/20 text-white leading-none"><BookOpen /></div>
                               <span className="bg-white text-slate-900 px-6 py-3 rounded-full font-black text-[11px] uppercase shadow-2xl leading-none">TOTAL {count}</span>
                            </div>
                            <div className="relative z-10 mt-auto p-10 bg-gradient-to-t from-slate-950 to-transparent text-left leading-none">
                               <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">{course}</h3>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden animate-in slide-in-from-right-8 duration-500 text-left leading-none">
                   <div className="p-12 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-8 leading-none text-left">
                    <div className="flex items-center gap-8 text-left text-black leading-none"><button onClick={() => { setSelectedCourse(null); setSearchQuery(""); }} className="p-4 bg-white rounded-3xl border border-slate-100 text-slate-400 hover:text-red-600 transition-all shadow-md flex items-center justify-center leading-none text-slate-400"><ChevronLeft /></button><div><h2 className="text-2xl font-black text-slate-800 uppercase mb-3 leading-none text-slate-800">{selectedCourse}</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest text-left mt-1">Daftar Seluruh Peserta</p></div></div>
                    <div className="flex bg-slate-200 p-2 rounded-[2rem] shadow-inner relative w-64 h-16 leading-none"><div className={`absolute top-2 bottom-2 w-[calc(50%-8px)] bg-white rounded-2xl shadow-lg transition-all duration-300 ${dbCategory === 'Private' ? 'left-[calc(50%+4px)]' : 'left-2'} leading-none`}></div><button onClick={() => setDbCategory("Reguler")} className={`flex-1 relative z-10 font-black text-[11px] uppercase tracking-widest transition-colors ${dbCategory === 'Reguler' ? 'text-slate-900' : 'text-slate-400'} leading-none`}>Reguler</button><button onClick={() => setDbCategory("Private")} className={`flex-1 relative z-10 font-black text-[11px] uppercase tracking-widest transition-colors ${dbCategory === 'Private' ? 'text-slate-900' : 'text-slate-400'} leading-none`}>Private</button></div>
                  </div>
                  
                  <div className="overflow-x-auto text-left leading-none">
                    <table className="w-full text-left font-sans leading-none text-left"><thead className="bg-white border-b border-slate-50 font-black text-[11px] uppercase text-slate-400 tracking-widest leading-none text-left"><tr><th className="p-12 w-20 leading-none text-slate-400 text-left">No</th><th className="text-left leading-none text-slate-400 text-left">Peserta & Kontak</th><th className="text-center w-32 leading-none text-slate-400 text-center">Aksi</th></tr></thead>
                      <tbody className="divide-y divide-slate-50 leading-none text-left">
                        {participants.filter(p => p.program === selectedCourse && p.category === dbCategory).length > 0 ? (
                          participants.filter(p => p.program === selectedCourse && p.category === dbCategory).map((p, i) => (
                            <tr key={p.id} className="hover:bg-red-50/30 transition-colors group cursor-pointer leading-none text-left" onClick={() => handleOpenDetail(p)}>
                              <td className="p-12 text-slate-300 font-bold font-mono leading-none text-left">{i + 1}</td>
                              <td className="p-12 flex items-center gap-8 leading-none text-black leading-none text-left text-left">
                                <div className="w-20 h-20 rounded-[2rem] border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center overflow-hidden leading-none text-left">
                                  {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : <img src={IKON_GENDER[p.gender]} className="w-8 h-8 opacity-30 text-left" />}
                                </div>
                                <div className="flex flex-col gap-3 leading-none text-left">
                                   <div className="flex items-center gap-4 leading-none text-left">
                                      <span className="text-lg font-black uppercase text-slate-800 text-left">{p.nama}</span>
                                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest leading-none ${p.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                         {p.status?.toUpperCase()}
                                      </span>
                                   </div>
                                   <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 leading-none text-left">
                                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm leading-none text-left">
                                         <img src={LOGO_WA} className="w-4 h-4 leading-none" />
                                         <span className="text-slate-600 leading-none">{p.telepon}</span>
                                      </div>
                                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm leading-none text-left">
                                         <Mail size={14} className="text-blue-500 leading-none" />
                                         <span className="text-slate-600 lowercase leading-none">{p.email}</span>
                                      </div>
                                   </div>
                                </div>
                              </td>
                              <td className="p-12 text-center leading-none text-left text-center">
                                <div className="flex flex-col items-center justify-center gap-3 text-center">
                                  <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(p); }} className="p-3.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition shadow-sm leading-none flex items-center justify-center text-blue-600"><Edit size={18} /></button>
                                  <button onClick={(e) => { e.stopPropagation(); handleOpenDetail(p); }} className="p-3.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition shadow-sm leading-none flex items-center justify-center text-slate-400"><Eye size={18} /></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (<tr><td colSpan="3" className="p-24 text-center font-black text-slate-200 uppercase tracking-widest text-sm italic leading-none text-center">Data Siswa Tidak Ditemukan</td></tr>)}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB PENILAIAN & KELULUSAN */}
          {activeTab === 'input_nilai' && (
            <div className="animate-in fade-in duration-700 relative text-left leading-none text-left">
              {!selectedGradCourse ? (
                <div className="space-y-12 text-left">
                  {/* --- AREA PENCARIAN GLOBAL ALUMNI (KEMBALI) --- */}
                  <div className="flex flex-col lg:flex-row justify-between items-center gap-8 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 text-left">
                    <div className="text-left leading-none">
                      <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-3">Penilaian Akademik</h2>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">Kelola Hasil Belajar & Kelulusan</p>
                    </div>
                    <div className="relative w-full lg:w-[400px]">
                       <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                       <input
                         type="text"
                         placeholder="Cari Lulusan Global..."
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-700 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-50 transition-all"
                       />
                    </div>
                  </div>

                  {searchQuery ? (
                    /* HASIL PENCARIAN GLOBAL ALUMNI */
                    <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500 text-left leading-none">
                      <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                        <span className="font-black text-slate-600 uppercase tracking-widest text-[11px]">Hasil Pencarian Lulusan: "{searchQuery}"</span>
                        <button onClick={() => setSearchQuery("")} className="px-5 py-2.5 bg-red-100 text-red-600 rounded-full font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-colors">Tutup Pencarian</button>
                      </div>
                      <div className="overflow-x-auto text-left leading-none">
                        <table className="w-full text-left font-sans leading-none text-left">
                          <thead className="bg-white border-b border-slate-50 font-black text-[11px] uppercase text-slate-400 tracking-widest leading-none text-left">
                            <tr>
                              <th className="p-10 w-20 text-slate-400">No</th>
                              <th className="p-10 text-slate-400">Nama Lulusan & Program</th>
                              <th className="p-10 text-center text-slate-400">AVG Score</th>
                              <th className="p-10 text-center w-40 text-slate-400">Print</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 leading-none text-left">
                            {participants.filter(p => p.status === 'Lulus' && p.nama.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                              participants.filter(p => p.status === 'Lulus' && p.nama.toLowerCase().includes(searchQuery.toLowerCase())).map((p, i) => (
                                 <tr key={p.id} className="hover:bg-amber-50 transition-colors group cursor-pointer" onClick={() => handleOpenDetail(p)}>
                                    <td className="p-10 text-slate-300 font-bold font-mono">{i + 1}</td>
                                    <td className="p-10 flex items-center gap-6">
                                      <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                        {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : <img src={IKON_GENDER[p.gender]} className="w-8 h-8 opacity-30" />}
                                      </div>
                                      <div className="flex flex-col gap-2">
                                         <span className="text-base font-black uppercase text-slate-800">{p.nama}</span>
                                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.program}</span>
                                      </div>
                                    </td>
                                    <td className="p-10 text-center font-black text-2xl text-slate-800 tracking-tighter">{hitungRataRata(p.nilai)}</td>
                                    <td className="p-10 text-center">
                                      <button onClick={(e) => { e.stopPropagation(); handleDirectPrint(p); }} className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg flex items-center justify-center mx-auto hover:bg-amber-600 transition-colors"><Printer size={20} /></button>
                                    </td>
                                 </tr>
                              ))
                            ) : (
                              <tr><td colSpan="4" className="p-20 text-center font-black text-slate-300 uppercase tracking-widest text-xs">Lulusan Tidak Ditemukan</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 leading-none">
                      {PROGRAM_CHOICES.map((course, idx) => {
                        const count = participants.filter(p => p.program === course && p.status === 'Lulus').length;
                        return (
                          <div key={idx} onClick={() => setSelectedGradCourse(course)} className="group bg-white rounded-[3.5rem] overflow-hidden shadow-md hover:shadow-2xl transition-all cursor-pointer border border-slate-100 flex flex-col h-80 relative">
                             <div className="absolute inset-0 z-0"><img src={getProgramThumb(course)} alt={course} className="w-full h-full object-cover opacity-80" /><div className="absolute inset-0 bg-amber-900/60" /></div>
                             <div className="relative z-10 p-8 flex justify-between items-start leading-none text-white">
                                 <div className="bg-white/10 backdrop-blur-xl p-4 rounded-3xl border border-white/20 text-white leading-none"><Award /></div>
                                 <span className="bg-amber-500 text-white px-6 py-3 rounded-full font-black text-[11px] uppercase shadow-2xl leading-none">{count} LULUSAN</span>
                             </div>
                             <div className="relative z-10 mt-auto p-10 bg-gradient-to-t from-amber-950 to-transparent text-left leading-none">
                                 <h3 className="text-xl font-black text-white uppercase tracking-tight text-left">{course}</h3>
                             </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden leading-none text-left animate-in slide-in-from-right-8 duration-500 text-left">
                   <div className="p-12 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-8 text-black leading-none text-left"><div className="flex items-center gap-8 text-left text-black"><button onClick={() => { setSelectedGradCourse(null); setSearchQuery(""); }} className="p-4 bg-white rounded-3xl border border-slate-100 text-slate-400 hover:text-amber-600 transition-all shadow-md flex items-center justify-center leading-none text-slate-400"><ChevronLeft /></button><div><h2 className="text-3xl font-black text-slate-800 uppercase mb-3 text-left text-slate-800">{selectedGradCourse}</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest text-left">Database Siswa Lulus</p></div></div></div>

                   <div className="overflow-x-auto leading-none">
                        <table className="w-full text-left font-sans leading-none text-left"><thead className="bg-white border-b border-slate-50 font-black text-[11px] uppercase text-slate-400 tracking-widest leading-none text-left"><tr><th className="p-12 w-20 leading-none text-slate-400 text-left">No</th><th className="text-left leading-none text-slate-400 text-left">Nama Peserta</th><th className="text-center leading-none text-slate-400 text-center">AVG Score</th><th className="text-center w-40 leading-none text-slate-400 text-center">Print</th></tr></thead><tbody className="divide-y divide-slate-50 leading-none text-left">
                        {participants.filter(p => p.status === 'Lulus' && p.program === selectedGradCourse).map((p, i) => (
                           <tr key={p.id} className="hover:bg-amber-50 transition-colors group cursor-pointer leading-none text-left" onClick={() => handleOpenDetail(p)}><td className="p-12 text-slate-300 font-bold font-mono text-left leading-none">{i + 1}</td><td className="p-12 font-black uppercase text-slate-800 flex items-center gap-6 leading-none text-left text-black"><div className="w-12 h-12 rounded-2xl border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center overflow-hidden leading-none text-left text-black">{p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : <img src={IKON_GENDER[p.gender]} className="w-6 h-6 opacity-30 text-left" />}</div>{p.nama}</td><td className="p-12 text-center font-black text-2xl text-slate-800 tracking-tighter text-center leading-none text-slate-800">{hitungRataRata(p.nilai)}</td><td className="p-12 text-center leading-none text-center"><button onClick={(e) => { e.stopPropagation(); handleDirectPrint(p); }} className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg leading-none flex items-center justify-center mx-auto text-white leading-none"><Printer size={20} /></button></td></tr>
                        ))}
                     </tbody></table></div>
                </div>
              )}
              
              {/* --- FLOAT ACTION BUTTONS (PRINT & DOWNLOAD ADDED) --- */}
              <div className="fixed bottom-12 right-12 flex flex-col items-center gap-5 z-[80] group leading-none text-left">
                  
                  <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 leading-none">
                    <button onClick={() => showNotification("Download Laporan Sedang Diproses...")} className="w-14 h-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center border-4 border-white shadow-slate-200 group/btn relative">
                       <Download size={24} />
                       <div className="absolute right-20 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity">Download Excel</div>
                    </button>
                  </div>

                  <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 leading-none">
                    <button onClick={handlePrintGlobalReport} className="w-14 h-14 bg-amber-500 text-white rounded-full shadow-xl flex items-center justify-center border-4 border-white shadow-amber-200 group/btn relative">
                       <Printer size={24} />
                       <div className="absolute right-20 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">Cetak PDF Laporan</div>
                    </button>
                  </div>

                  <button onClick={() => setIsStudentPickerOpen(true)} className="w-20 h-20 bg-blue-600 text-white rounded-full shadow-[0_20px_50px_rgba(37,99,235,0.4)] flex items-center justify-center hover:scale-110 hover:rotate-90 transition-all border-4 border-white leading-none relative group/main shadow-blue-200 text-white">
                    <Plus size={40} />
                    <div className="absolute right-24 px-4 py-2 bg-slate-900/90 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/main:opacity-100 transition-all pointer-events-none whitespace-nowrap leading-none border border-white/10 text-white text-left">Input Nilai Siswa</div>
                  </button>
              </div>
            </div>
          )}

          {/* TAB ARSIP SERTIFIKAT (STABIL) */}
          {activeTab === 'certificates' && (
             <div className="animate-in fade-in leading-none text-left">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8 text-left leading-none text-left">
                  <div className="text-left leading-none text-left"><h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter mb-3">Archive Sertifikat</h2><p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-none text-left">Backup Dokumen PDF Sertifikat Digital</p></div>
                  <button onClick={() => setIsUploadModalOpen(true)} className="p-4 bg-amber-500 text-white rounded-2xl shadow-xl hover:bg-amber-600 transition-all flex items-center gap-3 leading-none text-white"><CloudUpload size={20} /><span className="font-black text-[10px] uppercase tracking-widest leading-none">Upload Backup</span></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 leading-none">
                  {certificates.map(cert => (
                    <div key={cert.id} className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col items-center text-center leading-none text-left">
                      <div className="w-20 h-20 bg-slate-50 text-red-500 rounded-[2rem] flex items-center justify-center mb-6 border-2 border-slate-50 group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm leading-none text-red-500 text-left"><FileText size={32} /></div>
                      <h3 className="font-black text-slate-800 uppercase text-center text-sm mb-2 leading-tight h-10 flex items-center leading-none text-center text-slate-800 text-left">{cert.namaSiswa}</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-4 leading-none text-center">{cert.program}</p>
                      <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 flex flex-col items-center text-center leading-none text-left">
                         <span className="text-[8px] font-black text-slate-300 uppercase leading-none mb-1 text-slate-300 text-center">NOMOR SERTIFIKAT</span>
                         <span className="text-[10px] font-black text-slate-600 leading-none text-center text-slate-600">{cert.noSertifikat}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 w-full leading-none text-left">
                         <a href={cert.fileUrl} download={cert.fileName} className="py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase hover:bg-blue-600 transition-all flex items-center justify-center gap-2 leading-none text-white text-left"><Download size={14} /> Download</a>
                         <button onClick={() => window.print()} className="py-3 bg-amber-500 text-white rounded-xl font-black text-[9px] uppercase hover:bg-amber-600 transition-all flex items-center justify-center gap-2 leading-none text-white text-left"><Printer size={14} /> Print</button>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </main>

        {/* --- MODAL UPLOAD SERTIFIKAT --- */}
        {isUploadModalOpen && (
           <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setIsUploadModalOpen(false)} />
             <div className="relative bg-white w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col border-8 border-slate-50 animate-in zoom-in-95 leading-none text-left">
                <div className="bg-amber-500 p-10 text-white flex justify-between items-center leading-none text-white text-left">
                   <div className="leading-none text-left text-white text-left">
                      <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Upload Backup</h3>
                      <p className="text-[10px] text-amber-100 mt-2 font-sans text-white uppercase text-left">Arsip Sertifikat PDF</p>
                   </div>
                   <button onClick={() => setIsUploadModalOpen(false)} className="text-white text-left"><X size={28}/></button>
                </div>
                <form onSubmit={handleUploadCert} className="p-10 space-y-6 flex flex-col text-left leading-none text-black text-left">
                   <div className="space-y-3 leading-none text-left text-black">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left text-slate-400">Nama Siswa</label>
                      <input name="namaSiswa" required type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-black uppercase" />
                   </div>
                   <div className="space-y-3 leading-none text-left text-black">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left text-slate-400">No. Sertifikat</label>
                      <input name="noSertifikat" required type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-black uppercase" />
                   </div>
                   <div className="space-y-3 leading-none text-left text-black">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left text-slate-400">Program</label>
                      <select name="program" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold bg-white text-black">
                         {PROGRAM_CHOICES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                   </div>
                   <div className="space-y-3 leading-none text-left text-black">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left text-slate-400">File Dokumen (.PDF / Gambar)</label>
                      <input name="file" required type="file" accept=".pdf,image/*" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200" />
                   </div>
                   <button type="submit" className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl shadow-xl uppercase tracking-widest text-[10px] hover:bg-amber-500 transition-all leading-none mt-4 text-white text-center">Simpan ke Arsip</button>
                </form>
             </div>
          </div>
        )}

        {/* --- MODAL EDIT DATA (PHOTO & STATUS) --- */}
        {isEditModalOpen && selectedParticipant && (
           <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 text-left leading-none text-left">
             <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)} />
             <div className="relative bg-white w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col border-8 border-slate-50 animate-in zoom-in-95 leading-none text-left">
                <div className="bg-blue-600 p-10 text-white flex justify-between items-center leading-none text-white text-left">
                   <div className="leading-none text-left text-white text-left">
                      <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Update Siswa</h3>
                      <p className="text-[10px] text-blue-100 mt-2 opacity-80 font-sans text-white uppercase text-left">{selectedParticipant.nama}</p>
                   </div>
                   <button onClick={() => setIsEditModalOpen(false)} className="text-white text-left"><X size={28}/></button>
                </div>
                <form onSubmit={handleSaveEdit} className="p-10 space-y-6 flex flex-col text-left leading-none text-black text-left">
                   <div className="flex flex-col items-center gap-4 text-center text-left">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-[2.5rem] border-4 border-slate-100 shadow-xl overflow-hidden bg-slate-50 flex items-center justify-center leading-none text-left">
                            {tempPhoto ? <img src={tempPhoto} className="w-full h-full object-cover" /> : <User size={48} className="text-slate-200" />}
                        </div>
                        <label className="absolute -bottom-2 -right-2 p-3 bg-red-600 text-white rounded-2xl shadow-xl cursor-pointer hover:bg-slate-900 transition-all leading-none flex items-center justify-center text-white">
                           <Camera size={18} />
                           <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        </label>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-slate-400">Pilih Pas Foto</p>
                   </div>
                   <div className="space-y-3 leading-none text-left text-black">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left text-slate-400">Status Aktif</label>
                      <select name="status" defaultValue={selectedParticipant.status} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold bg-white leading-none text-left text-black">
                         <option value="Aktif">Siswa Aktif</option>
                         <option value="Non-Aktif">Berhenti/Cuti</option>
                         <option value="Lulus">Lulus</option>
                      </select>
                   </div>
                   <div className="space-y-3 leading-none text-left text-black">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left text-slate-400">Tanggal Selesai Belajar</label>
                      <input name="tanggalSelesaiBelajar" type="date" defaultValue={selectedParticipant.tanggalSelesaiBelajar} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold bg-white leading-none text-left text-black" />
                   </div>
                   <button type="submit" className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl shadow-xl uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all leading-none mt-4 text-white text-center">Simpan Perubahan</button>
                </form>
             </div>
          </div>
        )}

        {/* Modal Pilih Siswa untuk Penilaian */}
        {isStudentPickerOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setIsStudentPickerOpen(false)} />
            <div className="relative bg-white w-full max-w-lg rounded-[4rem] shadow-2xl overflow-hidden flex flex-col border-8 border-slate-50 animate-in zoom-in-95 leading-none text-left">
               <div className="bg-slate-950 p-10 text-white flex justify-between items-center leading-none shrink-0 uppercase tracking-tighter font-black text-white text-left leading-none text-left"><h3>Pilih Siswa Aktif</h3><button onClick={() => { setIsStudentPickerOpen(false); setSearchQuery(""); }} className="text-white leading-none"><X /></button></div>
               <div className="px-10 py-5 bg-slate-900 border-b border-slate-800">
                  <div className="relative w-full">
                     <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                     <input type="text" placeholder="Cari nama siswa..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-bold text-white outline-none focus:border-blue-500 transition-all" />
                  </div>
               </div>
               <div className="p-10 overflow-y-auto max-h-[60vh] space-y-5 leading-none text-left text-black font-sans text-left">
                  {participants.filter(p => p.status === 'Aktif' && p.nama.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                    participants.filter(p => p.status === 'Aktif' && p.nama.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                      <div key={p.id} onClick={() => { setSelectedParticipant(p); handleOpenNilai(p); setIsStudentPickerOpen(false); setSearchQuery(""); }} className="p-8 border border-slate-100 rounded-[3rem] bg-slate-50 flex items-center justify-between group cursor-pointer hover:bg-red-600 hover:text-white transition-all leading-none text-black text-left">
                        <div className="leading-none text-left text-black text-left text-left">
                           <p className="font-black text-lg uppercase mb-2 group-hover:text-white text-black leading-none text-left">{p.nama}</p>
                           <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest group-hover:text-white text-slate-500 leading-none text-left">{p.program}</p>
                        </div>
                        <ArrowRight className="w-6 h-6 text-red-600 group-hover:text-white transition-all text-red-600" />
                      </div>
                    ))
                  ) : (<p className="p-10 text-center font-black uppercase text-slate-300 text-[11px] text-center">Data Siswa Aktif Kosong</p>)}
               </div>
            </div>
          </div>
        )}

        {/* Modal Input Nilai Portrait */}
        {isNilaiModalOpen && selectedParticipant && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 leading-none text-left">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsNilaiModalOpen(false)} />
            <div className="relative bg-white w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-8 border-slate-50 animate-in zoom-in-95 leading-none text-black text-left">
              <div className="bg-slate-950 p-10 text-white flex justify-between items-center shrink-0 leading-none text-white text-left">
                <div className="text-left leading-none text-white text-left text-white">
                   <h3 className="text-2xl font-black tracking-tighter uppercase leading-none mb-3 text-left text-white">Input Skor</h3>
                   <span className="text-[9px] text-slate-400 tracking-[0.4em] font-sans uppercase text-left text-slate-400">SISWA: {selectedParticipant.nama}</span>
                </div>
                <button onClick={() => setIsNilaiModalOpen(false)} className="text-white leading-none text-white"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveNilai} className="flex flex-col overflow-hidden flex-grow leading-normal text-left text-black text-left">
                <div className="p-10 overflow-y-auto flex-grow leading-none text-left text-black text-left">
                   <div className="flex flex-col gap-4 text-left text-black leading-none text-left text-black">
                      {tempNilai.map((item, index) => (
                        <div key={index} className="flex items-center gap-5 bg-slate-50 p-5 rounded-[2rem] border border-slate-100 leading-none transition-all hover:bg-white hover:border-red-200 shadow-sm group text-left">
                           <div className="w-10 h-10 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 text-xs leading-none shrink-0 group-hover:border-red-600 group-hover:text-red-600 transition-colors leading-none text-left">{index + 1}</div>
                           <span className="flex-grow font-black text-[12px] uppercase text-slate-800 leading-none text-left text-slate-800">{item.materi}</span>
                           <input type="number" min="0" max="100" required value={item.skor} onChange={(e) => { const n = [...tempNilai]; n[index].skor = e.target.value; setTempNilai(n); }} className="w-20 px-3 py-4 rounded-[1.25rem] border-2 border-slate-200 outline-none focus:border-red-600 text-center font-black text-lg bg-white shadow-inner text-black leading-none" placeholder="0" />
                        </div>
                      ))}
                   </div>
                </div>
                <div className="p-10 bg-slate-100 border-t flex justify-end gap-5 shrink-0 leading-none text-black">
                    <button type="button" onClick={() => setIsNilaiModalOpen(false)} className="px-10 py-5 bg-white border border-slate-200 rounded-[2rem] font-black text-[10px] text-slate-800 text-center">Batal</button>
                    <button type="submit" className="px-14 py-5 bg-red-600 text-white font-black rounded-[2rem] hover:bg-red-700 shadow-2xl transition-all uppercase text-[10px] text-white text-center">Luluskan Siswa</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Detail (Gaya Executive) */}
        {isDetailModalOpen && selectedParticipant && (
          <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 text-left leading-none text-left">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsDetailModalOpen(false)} />
            <div className="relative bg-white w-full max-w-5xl rounded-[4.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col md:flex-row max-h-[90vh] border-[15px] border-slate-100 leading-none text-left">
              <div className="w-full md:w-[360px] bg-slate-50 border-r border-slate-100 flex flex-col items-center p-14 shrink-0 overflow-y-auto leading-none text-left text-left">
                 <div className="w-36 h-36 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-xl mb-8 shrink-0 leading-none text-slate-200 text-left">
                    {selectedParticipant.photo ? <img src={selectedParticipant.photo} className="w-full h-full object-cover rounded-full" /> : <User size={72} className="text-slate-200 text-left" />}
                 </div>
                 <h3 className="text-3xl font-black text-slate-800 text-center uppercase tracking-tighter leading-tight mb-3 font-sans leading-none text-slate-800 text-center">{selectedParticipant.nama}</h3>
                 <div className="bg-slate-950 text-white px-6 py-2.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 mb-10 shadow-lg leading-none uppercase shrink-0 text-white">NIK: {selectedParticipant.nik || '-'}</div>
                 <div className="w-full space-y-5 font-black uppercase text-[11px] tracking-widest leading-none text-left text-left">
                    
                    <a href={`https://wa.me/${selectedParticipant.telepon && selectedParticipant.telepon.startsWith('0') ? '62' + selectedParticipant.telepon.slice(1) : selectedParticipant.telepon}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm leading-none text-black text-left hover:bg-green-50 transition-colors group cursor-pointer">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-500 transition-colors">
                             <img src={LOGO_WA} alt="WA" className="w-4 h-4 group-hover:brightness-0 group-hover:invert transition-all" />
                          </div>
                          <span className="group-hover:text-green-700 transition-colors tracking-normal text-[13px]">{selectedParticipant.telepon || '-'}</span>
                       </div>
                       <Smartphone size={20} className="text-slate-300 group-hover:text-green-500 transition-colors text-left" />
                    </a>

                    <div className="flex items-center justify-between p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-black leading-none text-left"><div>Category</div><span className="text-red-600 font-black">{selectedParticipant.category?.toUpperCase()}</span></div>
                    <div className="flex items-center justify-between p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-black leading-none text-left text-left"><div>Status</div><span className={`px-4 py-2 rounded-full text-[9px] font-black leading-none ${selectedParticipant.status === 'Lulus' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{selectedParticipant.status?.toUpperCase()}</span></div>
                 </div>
                 <button onClick={() => setIsDetailModalOpen(false)} className="mt-14 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors flex items-center gap-3 leading-none shrink-0 text-left text-slate-400 leading-none"><X size={20} className="text-left" /> Close Profile</button>
              </div>
              <div className="flex-grow p-14 overflow-y-auto bg-white flex flex-col leading-normal text-left text-black font-sans leading-none text-left text-black text-left">
                 <div className="flex justify-between items-start mb-14 shrink-0 leading-none text-black text-left text-left">
                    <div className="text-left leading-none">
                       <p className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] mb-3 font-sans">Program Pilihan :</p>
                       <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-tight font-sans">
                          {selectedParticipant.program?.split(' (')[0]}
                          <span className="block text-2xl text-slate-500 mt-2 tracking-normal font-bold">
                             {selectedParticipant.program?.includes(' (') ? `(${selectedParticipant.program.split(' (')[1]}` : ''}
                          </span>
                       </h2>
                    </div>
                    <div className="bg-red-50 p-6 rounded-[2.5rem] border border-red-100 flex items-center gap-4 shrink-0 shadow-sm leading-none text-red-600"><BookOpen size={32} className="text-red-600"/><span className="text-[10px] font-black text-red-950 uppercase tracking-widest leading-none text-red-950">ENTER-ID #{selectedParticipant.id.toString().slice(-4)}</span></div>
                 </div>
                 <div className="bg-gradient-to-br from-red-600 to-red-900 rounded-[3.5rem] p-14 text-white shadow-2xl relative overflow-hidden flex items-center justify-between mb-12 shrink-0 leading-none text-white text-left text-left">
                    <div className="absolute right-0 top-0 w-64 h-full bg-white/5 skew-x-[-20deg] translate-x-32 leading-none text-white text-left"></div>
                    <div className="leading-none text-left leading-none z-10 text-white text-left text-left"><p className="text-[11px] font-black uppercase tracking-[0.5em] text-red-200 mb-8 flex items-center gap-3 font-sans text-white text-left text-red-200">Results <Award size={24} className="text-white"/></p><div className="flex items-baseline leading-none text-white text-left text-white text-left"><span className="text-8xl font-black tracking-tighter text-white leading-none text-left text-white">{hitungRataRata(selectedParticipant.nilai)}</span><span className="text-3xl font-black text-red-200 ml-4 tracking-widest text-white leading-none text-left text-white">/100</span></div></div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- AREA OUTPUT TRANSKRIP PDF (FORMAT A5) --- */}
      {selectedParticipant && (
        <div className="hidden print:flex bg-white text-black p-0 min-h-screen fixed inset-0 z-[9999] leading-none font-sans items-start justify-center">
          <div className="w-[14.8cm] min-h-[21cm] pt-8 px-10 pb-8 bg-white flex flex-col relative text-black" style={{ boxSizing: 'border-box' }}>
             
             {/* Header Kop Surat Area & Judul Form */}
             <div className="flex flex-col items-center text-center mb-6 pb-6">
                {/* Logo Manual di Atas Judul */}
                <img src={LOGO_UTAMA} alt="Logo" className="h-16 w-auto object-contain mb-4" />
                <h2 className="text-[13px] font-black uppercase underline decoration-2 mb-1">FORM. PENILAIAN PESERTA DIDIK</h2>
                <h3 className="text-[11px] font-bold uppercase mb-0.5 mt-2">KOMPUTER SHORT COURSE / REGULER</h3>
                <h3 className="text-[11px] font-bold uppercase">LEMBAGA KURSUS DAN PELATIHAN ENTER</h3>
             </div>

             {/* Info Detail Peserta */}
             <table className="w-full mb-4 text-xs font-bold uppercase leading-relaxed">
                <tbody>
                    <tr><td className="w-36 py-1">NAMA PESERTA</td><td className="w-4">:</td><td>{selectedParticipant.nama}</td></tr>
                    <tr><td className="py-1">PROGRAM</td><td>:</td><td>{selectedParticipant.program?.split(' (')[0]}</td></tr>
                    {/* HARI BELAJAR DIHILANGKAN */}
                    <tr><td className="py-1">JAM BELAJAR</td><td>:</td><td>{selectedParticipant.jamBelajar || '___________________________'}</td></tr>
                </tbody>
             </table>

             {/* Tabel Penilaian */}
             <div className="flex-grow mb-6">
                <table className="w-full border-collapse border-2 border-black text-xs font-bold">
                  <thead>
                     <tr className="border-b-2 border-black">
                        <th className="border-r-2 border-black p-2 w-12 text-center">NO</th>
                        <th className="border-r-2 border-black p-2 text-left pl-4">MATERI</th>
                        <th className="p-2 w-32 text-center">NILAI</th>
                     </tr>
                  </thead>
                  <tbody>
                    {selectedParticipant.nilai && selectedParticipant.nilai.length > 0 ? selectedParticipant.nilai.map((n, i) => (
                        <tr key={i} className="border-b border-black">
                           <td className="border-r-2 border-black p-2 text-center">{i + 1}</td>
                           <td className="border-r-2 border-black p-2 pl-4 uppercase">{n.materi}</td>
                           <td className="p-2 text-center text-sm">{n.skor}</td>
                        </tr>
                      )) : <tr><td colSpan="3" className="p-6 text-center">Data Belum Ada</td></tr>
                    }
                    <tr className="border-t-2 border-b border-black">
                       <td colSpan="2" className="border-r-2 border-black p-2 pr-4 text-right">JUMLAH</td>
                       <td className="p-2 text-center text-sm">{hitungTotal(selectedParticipant.nilai)}</td>
                    </tr>
                    <tr className="border-b border-black">
                       <td colSpan="2" className="border-r-2 border-black p-2 pr-4 text-right">RATA-RATA</td>
                       <td className="p-2 text-center text-sm">{hitungRataRata(selectedParticipant.nilai)}</td>
                    </tr>
                    <tr>
                       <td colSpan="2" className="border-r-2 border-black p-2 pr-4 text-right">KETERANGAN</td>
                       <td className="p-2 text-center text-sm">{getKeterangan(hitungRataRata(selectedParticipant.nilai))}</td>
                    </tr>
                  </tbody>
                </table>
             </div>

             {/* Footer Tanggal & Tanda Tangan */}
             <div className="flex justify-between items-end mt-auto text-xs font-bold uppercase">
                <div className="flex flex-col gap-3 pb-6">
                   <div>TGL. MASUK<span className="inline-block w-8 text-center">:</span>{selectedParticipant.tanggalMulaiBelajar || '.........................'}</div>
                   <div>TGL. KELUAR<span className="inline-block w-8 text-center">:</span>{selectedParticipant.tanggalKeluar || selectedParticipant.tanggalSelesaiBelajar || '.........................'}</div>
                </div>
                <div className="text-center w-40 flex flex-col items-center">
                   <p className="mb-20">MENGETAHUI</p>
                   <div className="w-full border-b border-black border-dashed"></div>
                </div>
             </div>

          </div>
        </div>
      )}

      {/* --- CSS OVERRIDES FOR PRINT (A5 PORTRAIT) --- */}
      <style>{`
        @media print {
          @page { size: A5 portrait; margin: 0; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; color: black !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hidden { display: none !important; }
          .hidden.print\\:block, .hidden.print\\:flex { display: flex !important; }
        }
      `}</style>
    </>
  );
}
