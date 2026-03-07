import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Home, UserPlus, Database, Edit3, 
  Eye, CheckCircle2, ChevronRight, GraduationCap,
  Save, BookOpen, Plus, Trash2, Calculator, Award,
  Info, Printer, Search, Layout, Video, Smartphone,
  FileText, Presentation, Globe, Mail, Image as ImageIcon,
  AlertCircle, MapPin, Calendar, Clock, User, ChevronLeft, ArrowRight,
  Phone, CalendarDays, Filter, Headset, TrendingUp, Users, CheckCircle,
  FileCheck, Download, CloudUpload, File, ShieldCheck, Camera, Edit, CalendarCheck, FolderArchive,
  Upload
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, addDoc, updateDoc } from 'firebase/firestore';

// ==========================================
// 1. ASSET & KONFIGURASI (STABIL)
// ==========================================
const LOGO_WA = "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg";
const LOGO_UTAMA = "./logo.png";

const IKON_GENDER = {
  "Laki-laki": "https://cdn-icons-png.flaticon.com/512/4128/4128176.png",
  "Perempuan": "https://cdn-icons-png.flaticon.com/512/4128/4128171.png"
};

const DAFTAR_AGAMA = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"];
const JAM_BELAJAR_OPTIONS = ["16.00 - 17.30", "18.30 - 20.00 (belum dibuka)"];
const DAFTAR_PIKET = ["Saniman", "Lalili nurtikasari", "Gatot Febriano"];

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

const getPertemuanCount = (programName) => {
  const match = programName.match(/(\d+)x Pertemuan/);
  return match ? parseInt(match[1]) : 0;
};

// Komponen Universal Logo
const EnterLogo = ({ size = "w-10 h-10 sm:w-14 sm:h-14" }) => (
  <div className={`${size} bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0 transition-transform hover:scale-105 duration-300 overflow-hidden`}>
    {LOGO_UTAMA ? (
      <>
        <img 
          src={LOGO_UTAMA} 
          alt="Logo" 
          className="w-full h-full object-contain bg-white" 
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} 
        />
        <span className="font-black text-xl sm:text-2xl leading-none italic select-none hidden">E</span>
      </>
    ) : (
      <span className="font-black text-xl sm:text-2xl leading-none italic select-none">E</span>
    )}
  </div>
);

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
  appId: "1:861625929338:web:d5111f6422745154ad35c3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'database-shortcourse-enter';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [message, setMessage] = useState(null);
  const [isImporting, setIsImporting] = useState(false); // State untuk loading Import
  
  // State untuk Database Hierarchy
  const [dbViewStatus, setDbViewStatus] = useState(null);
  const [dbViewProgram, setDbViewProgram] = useState(null);
  const [dbViewCategory, setDbViewCategory] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  
  const [certificates, setCertificates] = useState([]);
  const [participants, setParticipants] = useState([]);

  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isNilaiModalOpen, setIsNilaiModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [tempNilai, setTempNilai] = useState([]);
  
  // State untuk Absensi
  const [selectedAbsensiCourse, setSelectedAbsensiCourse] = useState(null);

  // Kategori Absensi otomatis dari activeTab
  const currentAbsensiCategory = activeTab === 'absensi_reguler' ? 'Reguler' : (activeTab === 'absensi_private' ? 'Private' : null);
  const isReguler = currentAbsensiCategory === 'Reguler';

  // State Baru untuk Absensi Reguler (Sistem Form Harian)
  const [piketReguler, setPiketReguler] = useState("");
  const [selectedStudentForAbsen, setSelectedStudentForAbsen] = useState("");
  const [dailyAttendees, setDailyAttendees] = useState([]);

  // Data Terfilter untuk Absensi Reguler
  const activeRegulerParticipants = participants
      .filter(p => p.status === 'Aktif' && p.category === 'Reguler')
      .sort((a, b) => a.nama.localeCompare(b.nama));
  const selectedStudentData = activeRegulerParticipants.find(p => p.id === selectedStudentForAbsen);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Gagal inisialisasi Auth:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const participantsRef = collection(db, 'artifacts', appId, 'public', 'data', 'participants');
    const unsubParticipants = onSnapshot(participantsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setParticipants(data.reverse()); 
    });

    const certsRef = collection(db, 'artifacts', appId, 'public', 'data', 'certificates');
    const unsubCerts = onSnapshot(certsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCertificates(data.reverse());
    });

    return () => {
      unsubParticipants();
      unsubCerts();
    };
  }, [user]);

  const handleNavigation = (tab) => { 
    setActiveTab(tab); 
    setIsMenuOpen(false); 
    
    // Reset State Tab Lainnya
    setDbViewStatus(null);
    setDbViewProgram(null);
    setDbViewCategory(null);
    setSelectedAbsensiCourse(null);
    setIsDetailModalOpen(false);
    setIsEditProfileModalOpen(false);
    setIsNilaiModalOpen(false);
    setSelectedParticipant(null);
    setSearchQuery("");

    // Reset Form Absensi Reguler
    setDailyAttendees([]);
    setPiketReguler("");
    setSelectedStudentForAbsen("");

    window.scrollTo(0, 0);
  };

  const showNotification = (msg) => { setMessage(msg); setTimeout(() => setMessage(null), 3000); };

  const handleAddParticipant = async (data) => {
    if (!user) {
      showNotification("Mohon tunggu, sedang menghubungkan ke database...");
      return;
    }
    
    const newParticipant = { 
      ...data, 
      tanggalDaftar: new Date().toLocaleDateString('id-ID'), 
      status: 'Aktif', 
      nilai: [], 
      photo: null, 
      tanggalSelesaiBelajar: '',
      absensi: [], 
      pengajarPrivate: '' 
    };

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'participants'), newParticipant);
      showNotification("Registrasi Berhasil Tersimpan!");
      setActiveTab('database');
    } catch (e) {
      console.error("Error menambah data:", e);
      showNotification("Gagal menyimpan data.");
    }
  };

  const handleUploadCert = async (e) => {
    e.preventDefault();
    if (!user) return;
    
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

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'certificates'), newCert);
      setIsUploadModalOpen(false);
      showNotification("Backup Sertifikat Tersimpan Aman di Cloud!");
    } catch (e) {
      console.error(e);
      showNotification("Gagal upload sertifikat.");
    }
  };

  const handleOpenDetail = (p) => {
    setSelectedParticipant(p);
    setIsDetailModalOpen(true);
  };

  const handleOpenEditProfile = (p) => {
    setSelectedParticipant(p);
    setIsEditProfileModalOpen(true);
  };

  const handleSaveProfileUpdate = async (e) => {
    e.preventDefault();
    if (!user || !selectedParticipant) return;
    
    const fd = new FormData(e.target);
    const updatedData = Object.fromEntries(fd.entries());
    
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'participants', selectedParticipant.id);
    try {
        await updateDoc(docRef, updatedData);
        showNotification("Profil Peserta Berhasil Diperbarui!");
        setIsEditProfileModalOpen(false);
    } catch (err) {
        console.error(err);
        showNotification("Gagal memperbarui profil peserta.");
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

  const handleInstantUpdate = async (field, value) => {
    if (!user || !selectedParticipant) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'participants', selectedParticipant.id);
    try {
        await updateDoc(docRef, { [field]: value });
        setSelectedParticipant(prev => ({ ...prev, [field]: value }));
        showNotification("Data Berhasil Diperbarui!");
    } catch (err) {
        console.error(err);
        showNotification("Gagal memperbarui data.");
    }
  };

  const handlePhotoUploadInstant = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
         handleInstantUpdate('photo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNilai = async (e) => {
    e.preventDefault();
    if(!user || !selectedParticipant) return;
    
    const today = new Date();
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

  // ==========================================
  // FITUR BARU: IMPORT CSV OTOMATIS
  // ==========================================
  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if(!file || !user) return;
    
    setIsImporting(true);
    showNotification("Sedang membaca dan mengimpor data CSV...");
    
    const reader = new FileReader();
    reader.onload = async (event) => {
       const text = event.target.result;
       const lines = text.split('\n');
       
       let importedCount = 0;
       
       // Mulai dari i=1 untuk melewati baris judul (header) di CSV
       for(let i = 1; i < lines.length; i++) {
           if(!lines[i].trim()) continue;
           
           // Regex untuk memisahkan data CSV yang dipisahkan koma, 
           // tanpa memisahkan koma yang ada di dalam tanda kutip ganda (")
           const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
           
           // Penyesuaian Nama Program dari CSV ke Format Sistem
           const rawProgram = values[5] ? values[5].replace(/"/g, '').trim() : "";
           let program = rawProgram;
           const rawLower = rawProgram.toLowerCase();
           
           if (rawLower.includes("office expert")) program = "Microsoft Office Expert (36x Pertemuan)";
           else if (rawLower.includes("office basic")) program = "Microsoft Office Basic (12x Pertemuan)";
           else if (rawLower.includes("excel")) program = "Microsoft Office Excel (20x Pertemuan)";
           else if (rawLower.includes("design grafis") || rawLower.includes("desain grafis")) program = "Desain Grafis (24x Pertemuan)";
           
           // Penyesuaian Status
           let rawStatus = values[7] ? values[7].replace(/"/g, '').trim() : "";
           let status = "Aktif";
           if(rawStatus.toLowerCase() === 'selesai' || rawStatus.toLowerCase() === 'lulus') status = "Lulus";
           
           // Membuat Objek Peserta Sesuai Format Firebase Sistem
           const newParticipant = {
               nik: "",
               nama: values[1] ? values[1].replace(/"/g, '').trim() : "",
               tempatLahir: values[2] ? values[2].replace(/"/g, '').trim() : "",
               tanggalLahir: values[3] ? values[3].replace(/"/g, '').trim() : "",
               gender: values[4] ? values[4].replace(/"/g, '').trim() : "",
               agama: "",
               telepon: values[8] ? values[8].replace(/"/g, '').trim() : "",
               email: "",
               alamat: "",
               program: program || "Microsoft Office Basic (12x Pertemuan)", // fallback aman
               category: values[9] ? values[9].replace(/"/g, '').trim() : "Reguler",
               jamBelajar: "",
               tanggalMulaiBelajar: values[10] ? values[10].replace(/"/g, '').trim() : "",
               tanggalDaftar: new Date().toLocaleDateString('id-ID'),
               status: status,
               tanggalSelesaiBelajar: values[11] ? values[11].replace(/"/g, '').trim() : "",
               nilai: [],
               photo: null,
               absensi: [],
               pengajarPrivate: ""
           };

           try {
              // Simpan langsung ke Firebase
              await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'participants'), newParticipant);
              importedCount++;
           } catch(err) {
              console.error("Gagal import baris CSV ke-", i, err);
           }
       }
       
       setIsImporting(false);
       showNotification(`Sukses! ${importedCount} data siswa berhasil diimpor.`);
       e.target.value = null; // Reset input file agar bisa import file yang sama lagi jika perlu
       setActiveTab('database'); // Arahkan ke database untuk melihat hasilnya
    };
    reader.readAsText(file);
  };

  // ==========================================
  // LOGIKA ABSENSI REGULER (DENGAN MANUAL BACKFILL)
  // ==========================================
  const handleAddDailyAttendee = () => {
      if(!selectedStudentForAbsen) return;
      const student = participants.find(p => p.id === selectedStudentForAbsen);
      if(student && !dailyAttendees.find(a => a.id === student.id)) {
          const maxExisting = (student.absensi || []).reduce((max, a) => Math.max(max, a.pertemuan), 0);
          const intendedMeeting = maxExisting + 1; 
          
          setDailyAttendees([...dailyAttendees, { ...student, inputPertemuan: intendedMeeting }]);
      }
      setSelectedStudentForAbsen("");
  };

  const handleRemoveDailyAttendee = (id) => {
      setDailyAttendees(dailyAttendees.filter(a => a.id !== id));
  };

  const handleUpdateMeetingNumber = (id, newNumber) => {
      const parsed = parseInt(newNumber) || 1;
      setDailyAttendees(dailyAttendees.map(a => a.id === id ? { ...a, inputPertemuan: parsed } : a));
  };

  const handleSaveDailyAttendance = async () => {
      if(!user) return;
      if(dailyAttendees.length === 0) {
          showNotification("Belum ada peserta yang ditambahkan!");
          return;
      }
      if(!piketReguler) {
          showNotification("Mohon pilih Instruktur Piket terlebih dahulu!");
          return;
      }

      showNotification("Sedang menyimpan & sinkronisasi absensi...");
      const hariIni = new Date().toLocaleDateString('id-ID');

      try {
          for(let p of dailyAttendees) {
              let currentAbsensi = p.absensi ? [...p.absensi] : [];
              const targetPertemuan = p.inputPertemuan;

              const maxExisting = currentAbsensi.reduce((max, a) => Math.max(max, a.pertemuan), 0);
              
              if (targetPertemuan > maxExisting + 1) {
                  for (let i = maxExisting + 1; i < targetPertemuan; i++) {
                      if (!currentAbsensi.find(a => a.pertemuan === i)) {
                          currentAbsensi.push({
                              pertemuan: i,
                              tanggal: "Auto-Sync",
                              instruktur: "Sistem Manual",
                              piket: "Admin"
                          });
                      }
                  }
              }

              const existingIndex = currentAbsensi.findIndex(a => a.pertemuan === targetPertemuan);
              const newRecord = {
                  pertemuan: targetPertemuan,
                  tanggal: hariIni,
                  instruktur: "Jamaludin Dwi Laspandi",
                  piket: piketReguler
              };

              if (existingIndex !== -1) {
                  currentAbsensi[existingIndex] = newRecord;
              } else {
                  currentAbsensi.push(newRecord);
              }

              const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'participants', p.id);
              await updateDoc(docRef, { absensi: currentAbsensi });
          }
          
          showNotification("Absensi Harian Berhasil Disimpan & Disinkronkan!");
          setDailyAttendees([]); 
          setPiketReguler("");
          setSelectedStudentForAbsen("");
      } catch(e) {
          console.error(e);
          showNotification("Gagal menyimpan absensi, periksa koneksi internet.");
      }
  };

  const handleToggleAbsenPrivate = async (participantId, pertemuanKe, currentStatus) => {
      if(!user) return;
      const participant = participants.find(p => p.id === participantId);
      if(!participant) return;

      let newAbsensi = participant.absensi ? [...participant.absensi] : [];
      const absensiIndex = newAbsensi.findIndex(a => a.pertemuan === pertemuanKe);
      
      const hariIni = new Date().toLocaleDateString('id-ID');

      if (absensiIndex !== -1) {
          if(currentStatus) {
               newAbsensi.splice(absensiIndex, 1);
          } else {
              newAbsensi[absensiIndex] = { pertemuan: pertemuanKe, tanggal: hariIni };
          }
      } else {
          newAbsensi.push({ pertemuan: pertemuanKe, tanggal: hariIni });
      }

      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'participants', participantId);
      try {
          await updateDoc(docRef, { absensi: newAbsensi });
      } catch (err) {
          console.error("Gagal update absensi", err);
          showNotification("Gagal menyimpan absensi!");
      }
  };

  const handleUpdatePengajarPrivate = async (participantId, namaPengajar) => {
      if(!user) return;
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'participants', participantId);
      try {
          await updateDoc(docRef, { pengajarPrivate: namaPengajar });
      } catch (err) {
          console.error("Gagal update pengajar", err);
      }
  };

  const handleDownloadExcel = () => {
    if (participants.length === 0) {
      showNotification("Database masih kosong, tidak ada data untuk didownload.");
      return;
    }
    
    showNotification("Menyiapkan Laporan CSV...");
    
    const headers = [
      "No", "NIK", "Nama Lengkap", "Tempat Lahir", "Tanggal Lahir",
      "Jenis Kelamin", "Agama", "No. WhatsApp", "Email", "Alamat Lengkap",
      "Program Kursus", "Kategori", "Status", "Jam Belajar", "Tanggal Daftar",
      "Tanggal Mulai", "Tanggal Selesai", "Rata-Rata Nilai", "Keterangan Hasil"
    ];

    const csvRows = [];
    csvRows.push(headers.join(",")); 

    participants.forEach((p, index) => {
      const rataRata = hitungRataRata(p.nilai);
      const row = [
        index + 1,
        `"${p.nik || "-"}"`,
        `"${p.nama || "-"}"`,
        `"${p.tempatLahir || "-"}"`,
        `"${p.tanggalLahir || "-"}"`,
        `"${p.gender || "-"}"`,
        `"${p.agama || "-"}"`,
        `"${p.telepon || "-"}"`,
        `"${p.email || "-"}"`,
        `"${p.alamat || "-"}"`,
        `"${p.program || "-"}"`,
        `"${p.category || "-"}"`,
        `"${p.status || "-"}"`,
        `"${p.jamBelajar || "-"}"`,
        `"${p.tanggalDaftar || "-"}"`,
        `"${p.tanggalMulaiBelajar || "-"}"`,
        `"${p.tanggalSelesaiBelajar || p.tanggalKeluar || "-"}"`,
        rataRata,
        `"${getKeterangan(rataRata)}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const tanggalHariIni = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
    link.setAttribute('download', `Laporan_Siswa_Shortcourse_${tanggalHariIni}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => showNotification("Laporan CSV Berhasil Diunduh!"), 1500);
  };

  // Definisi Item Navigasi yang digunakan di Desktop Sidebar & Mobile Drawer
  const NAV_ITEMS = [
    { id: 'home', label: 'Dashboard Utama', icon: <Home size={18} />, color: 'bg-blue-600 text-white' },
    { id: 'form', label: 'Registrasi Baru', icon: <UserPlus size={18} />, color: 'bg-orange-500 text-white' },
    { id: 'database', label: 'Master Database', icon: <Database size={18} />, color: 'bg-indigo-500 text-white' },
    { id: 'absensi_reguler', label: 'Absensi Reguler', icon: <CalendarCheck size={18} />, color: 'bg-teal-500 text-white' },
    { id: 'absensi_private', label: 'Absensi Private', icon: <CalendarDays size={18} />, color: 'bg-purple-500 text-white' },
    { id: 'certificates', label: 'Archive Sertifikat', icon: <FileCheck size={18} />, color: 'bg-amber-500 text-white' }
  ];

  return (
    <>
      <div className="print:hidden min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col items-center">
        
        {/* --- NOTIFIKASI TOAST --- */}
        {message && (
          <div className="fixed top-24 sm:top-32 left-1/2 transform -translate-x-1/2 z-[9999] animate-in slide-in-from-top-10 fade-in duration-500 w-[90%] sm:w-auto">
             <div className="bg-slate-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-3 border border-slate-700 text-center">
                <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                {message}
             </div>
          </div>
        )}

        {/* --- TOP BAR INFO KONTAK (FULL WIDTH) --- */}
        <div className="w-full bg-slate-900 text-slate-300 py-2.5 px-4 sm:px-6 lg:px-8 text-xs sm:text-sm border-b border-slate-800 z-50">
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-3 md:gap-6">
            
            {/* Bagian Alamat (Running Text) */}
            <div className="flex items-center gap-2 w-full md:w-auto md:flex-1 overflow-hidden marquee-container mr-0 md:mr-8 min-w-0">
              <MapPin size={14} className="text-blue-400 shrink-0" />
              <div className="overflow-hidden relative w-full flex fade-edges min-w-0">
                <div className="animate-marquee whitespace-nowrap flex gap-8 items-center transition-colors cursor-default hover:text-white">
                  <span><strong className="text-blue-400">Pusat:</strong> Jl. Pangeran Diponegoro No.2 C, Sidorejo, Kec. Arut Selatan, Kabupaten Kotawaringin Barat, Kalimantan Tengah</span>
                  <span className="text-slate-600 text-[8px] shrink-0">⬤</span>
                  <span><strong className="text-blue-400">Cabang 1:</strong> Jl. Kawitan I, Sidorejo, Kec. Arut Selatan, Kabupaten Kotawaringin Barat, Kalimantan Tengah</span>
                  <span className="text-slate-600 text-[8px] shrink-0">⬤</span>
                  <span><strong className="text-blue-400">Cabang 2:</strong> Jl. Palam Raya, Ruko, Jl. Griya Mawar Asri No.15, RT.47/RW.7, Guntungmanggis, Kec. Landasan Ulin, Kota Banjar Baru, Kalimantan Selatan</span>
                </div>
              </div>
            </div>

            {/* Bagian Telepon */}
            <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 font-medium shrink-0 w-full md:w-auto">
              <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer shrink-0">
                <Phone size={14} className="text-blue-400 shrink-0" />
                <span>0821 5050 9000</span>
              </div>
              <span className="text-slate-600 shrink-0">|</span>
              <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer shrink-0">
                <Phone size={14} className="text-blue-400 shrink-0" />
                <span>0821 5050 9002</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- HEADER UTAMA (FULL WIDTH) --- */}
        <header className="w-full bg-white shadow-sm border-b border-slate-200 sticky top-0 z-[100]">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              
              {/* Logo & Judul */}
              <div className="flex items-center gap-3 sm:gap-4 cursor-pointer group flex-1 min-w-0" onClick={() => handleNavigation('home')}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md transition-transform group-hover:scale-105 overflow-hidden shrink-0">
                  {LOGO_UTAMA ? (
                    <img 
                      src={LOGO_UTAMA} 
                      alt="Logo" 
                      className="w-full h-full object-contain bg-white"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }}
                    />
                  ) : null}
                  <span className={`${LOGO_UTAMA ? 'hidden' : ''} font-black text-2xl italic`}>E</span>
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-800 leading-none uppercase tracking-tighter group-hover:text-blue-600 transition-colors truncate">ENTER Borneo</h1>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase mt-1 truncate">Database Shortcourse</p>
                </div>
              </div>

              {/* Tombol Hamburger Tampilan HP (Desktop Disembunyikan karena ada Sidebar Kiri) */}
              <div className="flex items-center lg:hidden shrink-0 ml-4">
                <button onClick={() => setIsMenuOpen(true)} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl bg-slate-50 border border-slate-200 active:scale-95 transition-transform">
                  <Menu size={24} className="shrink-0" />
                </button>
              </div>

            </div>
          </div>
        </header>

        {/* --- MAIN LAYOUT (SIDEBAR KIRI & KONTEN KANAN) --- */}
        <div className="flex w-full max-w-[1600px] mx-auto items-start">
          
          {/* SIDEBAR KIRI (Hanya muncul di Desktop / Layar Lebar) */}
          <aside className="hidden lg:flex flex-col w-[280px] shrink-0 sticky top-[125px] h-[calc(100vh-125px)] overflow-y-auto p-6 bg-transparent border-r border-slate-200 border-dashed">
             <div className="mb-6 px-2">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Navigasi Admin</h2>
             </div>
             <nav className="flex flex-col gap-2.5">
               {NAV_ITEMS.map(item => (
                 <button 
                   key={item.id} 
                   onClick={() => handleNavigation(item.id)} 
                   className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 w-full text-left group ${activeTab === item.id ? 'bg-white shadow-md border border-slate-100 translate-x-1' : 'hover:bg-slate-200/50 border border-transparent hover:translate-x-1'}`}
                 >
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm ${activeTab === item.id ? item.color : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-600'}`}>
                     {item.icon}
                   </div>
                   <span className={`font-black uppercase text-[11px] tracking-widest transition-colors min-w-0 truncate ${activeTab === item.id ? 'text-slate-800' : 'text-slate-500 group-hover:text-slate-800'}`}>
                     {item.label}
                   </span>
                 </button>
               ))}
             </nav>
             
             {/* Kotak Info Kecil di Bawah Sidebar */}
             <div className="mt-auto pt-8 px-2">
                <div className="bg-slate-200/50 p-4 rounded-2xl border border-slate-200/60 flex flex-col gap-2">
                   <div className="flex items-center gap-2 text-slate-600">
                      <ShieldCheck size={16} className="shrink-0" />
                      <span className="font-black text-[9px] uppercase tracking-widest truncate">Sistem Aman</span>
                   </div>
                   <p className="text-[9px] font-medium text-slate-500 leading-relaxed">Versi 2.0. Auto-sync aktif. Data terenkripsi dengan aman di Firebase Cloud.</p>
                </div>
             </div>
          </aside>

          {/* DRAWER SIDEBAR KANAN (Hanya untuk Tampilan HP / Mobile) */}
          <div className={`fixed inset-y-0 right-0 z-[200] w-[85vw] max-w-[320px] bg-white shadow-2xl transform transition-transform duration-500 ease-in-out lg:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-5 sm:p-8 flex justify-between items-center border-b border-slate-100 text-left">
              <div className="flex flex-col text-left min-w-0">
                 <h2 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-tighter truncate">NAVIGASI SISTEM</h2>
                 <p className="text-[8px] sm:text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-1 truncate">Enter Training Center</p>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 sm:p-2.5 bg-slate-50 hover:bg-red-600 hover:text-white transition-all rounded-xl flex items-center justify-center text-slate-400 shrink-0 ml-2"><X size={20} className="shrink-0" /></button>
            </div>
            <div className="px-4 sm:px-6 py-6 space-y-3 sm:space-y-4 text-left overflow-y-auto max-h-[calc(100vh-100px)]">
              {NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => handleNavigation(item.id)} className={`w-full flex items-center space-x-4 p-3.5 sm:p-4 rounded-2xl sm:rounded-[2rem] transition-all ${activeTab === item.id ? 'bg-slate-100 text-blue-600 shadow-inner' : 'hover:bg-slate-50 text-slate-600'}`}>
                  <div className={`${item.color} p-2.5 sm:p-3 rounded-xl text-white shadow-md shrink-0`}>{item.icon}</div>
                  <span className="font-black uppercase text-[10px] sm:text-xs tracking-widest leading-none text-left min-w-0 truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 w-full min-w-0 py-6 sm:py-10 px-4 sm:px-8 lg:px-12 leading-none overflow-x-hidden pb-24 lg:pb-12">
            
            {/* TAB HOME */}
            {activeTab === 'home' && (
              <div className="animate-in fade-in duration-700 text-left space-y-6 sm:space-y-12">
                
                {/* Banner Section Premium */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 shadow-xl sm:shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-8 border border-slate-800">
                   {/* Dekorasi Background */}
                   <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                   <div className="absolute bottom-0 left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none"></div>

                   <div className="relative z-10 text-left min-w-0 w-full md:w-auto">
                      <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tighter uppercase leading-tight mb-1.5 sm:mb-4 truncate">
                        Halo, <span className="text-blue-400">Admin</span>
                      </h1>
                      <p className="text-slate-400 font-bold uppercase tracking-[0.1em] sm:tracking-[0.4em] text-[8px] sm:text-xs truncate">Pusat Manajemen Data SHORTCOURSE</p>
                   </div>
                   
                   <div className="relative z-10 flex gap-3 sm:gap-6 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                      <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex items-center gap-3 sm:gap-4 flex-1 md:w-48 shadow-xl hover:bg-white/20 transition-colors cursor-pointer min-w-[140px] shrink-0" onClick={() => handleNavigation('database')}>
                         <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shrink-0"><Users size={20} className="shrink-0" /></div>
                         <div className="min-w-0">
                            <div className="text-2xl sm:text-3xl font-black text-white leading-none truncate">{participants.filter(p => p.status === 'Aktif').length}</div>
                            <div className="text-[8px] sm:text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-1 truncate">Siswa Aktif</div>
                         </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex items-center gap-3 sm:gap-4 flex-1 md:w-48 shadow-xl hover:bg-white/20 transition-colors cursor-pointer min-w-[140px] shrink-0" onClick={() => handleNavigation('database')}>
                         <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0"><CheckCircle size={20} className="shrink-0" /></div>
                         <div className="min-w-0">
                            <div className="text-2xl sm:text-3xl font-black text-white leading-none truncate">{participants.filter(p => p.status === 'Lulus').length}</div>
                            <div className="text-[8px] sm:text-[10px] font-bold text-emerald-200 uppercase tracking-widest mt-1 truncate">Lulusan</div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Menu Akses Cepat */}
                <div>
                  <h3 className="text-[10px] sm:text-sm font-black text-slate-800 uppercase tracking-widest mb-3 sm:mb-6 ml-2">Menu Akses Cepat</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-6 text-left">
                    {[
                      { label: 'Registrasi', icon: <UserPlus size={20} className="sm:w-6 sm:h-6 shrink-0" />, color: 'bg-orange-50 text-orange-600', tab: 'form', desc: 'Input Baru', border: 'border-orange-100 hover:border-orange-400', shadow: 'hover:shadow-orange-500/20' },
                      { label: 'Database', icon: <Database size={20} className="sm:w-6 sm:h-6 shrink-0" />, color: 'bg-indigo-50 text-indigo-600', tab: 'database', desc: 'Kelola Data', border: 'border-indigo-100 hover:border-indigo-400', shadow: 'hover:shadow-indigo-500/20' },
                      { label: 'Reguler', icon: <CalendarCheck size={20} className="sm:w-6 sm:h-6 shrink-0" />, color: 'bg-teal-50 text-teal-600', tab: 'absensi_reguler', desc: 'Absen Kelas', border: 'border-teal-100 hover:border-teal-400', shadow: 'hover:shadow-teal-500/20' },
                      { label: 'Private', icon: <CalendarDays size={20} className="sm:w-6 sm:h-6 shrink-0" />, color: 'bg-purple-50 text-purple-600', tab: 'absensi_private', desc: 'Absen Personal', border: 'border-purple-100 hover:border-purple-400', shadow: 'hover:shadow-purple-500/20' },
                      { label: 'Sertifikat', icon: <FileCheck size={20} className="sm:w-6 sm:h-6 shrink-0" />, color: 'bg-amber-50 text-amber-600', tab: 'certificates', desc: 'Arsip PDF', border: 'border-amber-100 hover:border-amber-400', shadow: 'hover:shadow-amber-500/20' },
                      { label: 'Website', icon: <Globe size={20} className="sm:w-6 sm:h-6 shrink-0" />, color: 'bg-blue-50 text-blue-600', tab: null, desc: 'Enter Group', border: 'border-blue-100 hover:border-blue-400', shadow: 'hover:shadow-blue-500/20' }
                    ].map((btn, i) => (
                      <div key={i} onClick={() => btn.tab && handleNavigation(btn.tab)} className={`bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border ${btn.border} shadow-sm hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-start leading-none group duration-300 min-w-0 ${btn.shadow}`}>
                        <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${btn.color} group-hover:scale-110 mb-3 sm:mb-5 transition-transform duration-300 shrink-0 flex items-center justify-center`}>{btn.icon}</div>
                        <span className="text-xs sm:text-base font-black text-slate-800 uppercase tracking-tight mb-1 sm:mb-2 truncate w-full">{btn.label}</span>
                        <span className="text-[7px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate w-full">{btn.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section Info Bawah */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                   {/* Card Siswa Terbaru */}
                   <div className="lg:col-span-2 bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-slate-200 shadow-sm flex flex-col min-w-0">
                      <div className="flex justify-between items-center mb-4 sm:mb-6 gap-2">
                         <h3 className="text-[10px] sm:text-sm font-black text-slate-800 uppercase tracking-widest truncate">Pendaftaran Terbaru</h3>
                         <button onClick={() => handleNavigation('database')} className="text-[8px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 flex items-center gap-1 transition-colors shrink-0">Lihat Semua <ChevronRight size={14} className="shrink-0" /></button>
                      </div>
                      <div className="flex flex-col gap-2 sm:gap-3 flex-grow">
                         {participants.slice(0, 4).map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-3 sm:p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer group min-w-0 gap-3" onClick={() => handleOpenDetail(p)}>
                               <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 group-hover:border-blue-300 transition-colors">
                                     {p.photo ? <img src={p.photo} className="w-full h-full object-cover"/> : <User size={18} className="text-slate-400 shrink-0"/>}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                     <p className="font-black text-slate-800 text-xs sm:text-sm uppercase truncate">{p.nama}</p>
                                     <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 truncate">{p.program?.split(' (')[0]}</p>
                                  </div>
                               </div>
                               <span className="hidden sm:inline-block px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-100 text-slate-600 rounded-lg sm:rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest shrink-0 whitespace-nowrap">{p.tanggalDaftar}</span>
                            </div>
                         ))}
                         {participants.length === 0 && (
                            <div className="flex-grow flex items-center justify-center p-6 sm:p-8 border-2 border-dashed border-slate-100 rounded-2xl">
                               <span className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-widest italic text-center">Belum ada data siswa</span>
                            </div>
                         )}
                      </div>
                   </div>

                   {/* Card Action / Quick Stat */}
                   <div className="flex flex-col gap-6 sm:gap-8">
                       <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between flex-1">
                          <div className="absolute -right-8 -top-8 text-white/10 rotate-12 pointer-events-none">
                             <Database size={180} className="shrink-0" />
                          </div>
                          <div className="relative z-10">
                             <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white mb-4 sm:mb-6 shadow-inner shrink-0">
                                <UserPlus size={20} className="shrink-0" />
                             </div>
                             <h3 className="text-base sm:text-xl font-black text-white uppercase tracking-tight mb-2">Registrasi Baru</h3>
                             <p className="text-[9px] sm:text-xs font-medium text-blue-100 leading-relaxed mb-6">
                                Buka form pendaftaran untuk memasukkan data siswa shortcourse baru ke dalam sistem secara realtime.
                             </p>
                          </div>
                          <div className="relative z-10">
                             <button onClick={() => handleNavigation('form')} className="w-full py-3 sm:py-4 bg-white text-blue-700 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-md active:scale-95 text-center shrink-0">
                                + Input Data Siswa
                             </button>
                          </div>
                       </div>
                   </div>
                </div>
              </div>
            )}

            {/* TAB FORM REGISTRASI */}
            {activeTab === 'form' && (
              <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500 text-left w-full min-w-0">
                <div className="bg-white rounded-[2rem] sm:rounded-[4rem] shadow-xl border border-slate-200 overflow-hidden text-left leading-none flex flex-col w-full">
                  <div className="bg-slate-900 p-6 sm:p-12 text-white flex justify-between items-center leading-none text-white shrink-0">
                    <div className="min-w-0"><h2 className="text-xl sm:text-3xl font-black uppercase tracking-tighter leading-none text-white truncate">Registrasi</h2><p className="text-slate-400 text-[8px] sm:text-[11px] font-bold uppercase mt-1.5 sm:mt-3 tracking-widest leading-none truncate">Pendaftaran Siswa Baru</p></div>
                    <UserPlus className="w-8 h-8 sm:w-14 sm:h-14 text-blue-500 shrink-0 ml-4" />
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); handleAddParticipant(Object.fromEntries(new FormData(e.target))); e.target.reset(); }} className="p-5 sm:p-12 space-y-5 sm:space-y-8 leading-none text-left w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 text-left leading-none w-full">
                      <div className="space-y-2 sm:space-y-3 w-full"><label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">NIK</label><input name="nik" required type="number" className="appearance-none w-full px-4 sm:px-7 py-3 sm:py-5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold leading-none text-black text-xs sm:text-base transition-shadow" /></div>
                      <div className="space-y-2 sm:space-y-3 w-full"><label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Nama Lengkap</label><input name="nama" required type="text" className="appearance-none w-full px-4 sm:px-7 py-3 sm:py-5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold uppercase leading-none text-black text-xs sm:text-base transition-shadow" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 text-left leading-none w-full">
                      <div className="space-y-2 sm:space-y-3 w-full">
                         <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Tempat Lahir</label>
                         <input name="tempatLahir" required type="text" className="appearance-none w-full px-4 sm:px-7 py-3 sm:py-5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold leading-none text-black text-xs sm:text-base transition-shadow" />
                      </div>
                      <div className="space-y-2 sm:space-y-3 w-full">
                         <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Tanggal Lahir</label>
                         <input name="tanggalLahir" required type="date" className="appearance-none w-full px-4 sm:px-7 py-3 sm:py-5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold leading-none text-black text-xs sm:text-base transition-shadow min-h-[44px]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 text-left leading-none w-full">
                      <div className="space-y-2 sm:space-y-3 w-full">
                         <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Jenis Kelamin</label>
                         <select name="gender" required className="w-full px-4 sm:px-7 py-3 sm:py-5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-3xl font-bold bg-white outline-none leading-none text-black text-xs sm:text-base transition-shadow min-h-[44px]">
                            <option value="">-- Pilih Jenis Kelamin --</option>
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                         </select>
                      </div>
                      <div className="space-y-2 sm:space-y-3 w-full">
                         <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Agama</label>
                         <select name="agama" required className="w-full px-4 sm:px-7 py-3 sm:py-5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-3xl font-bold bg-white outline-none leading-none text-black text-xs sm:text-base transition-shadow min-h-[44px]">
                            <option value="">-- Pilih Agama --</option>
                            {DAFTAR_AGAMA.map(a => <option key={a} value={a}>{a}</option>)}
                         </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 text-left leading-none w-full">
                      <div className="space-y-2 sm:space-y-3 w-full"><label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Telepon/WA</label><input name="telepon" required type="number" className="appearance-none w-full px-4 sm:px-7 py-3 sm:py-5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-black text-xs sm:text-base transition-shadow" /></div>
                      <div className="space-y-2 sm:space-y-3 w-full"><label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Email</label><input name="email" required type="email" className="appearance-none w-full px-4 sm:px-7 py-3 sm:py-5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-black text-xs sm:text-base transition-shadow" /></div>
                    </div>
                    <div className="space-y-2 sm:space-y-3 mb-5 sm:mb-8 w-full">
                       <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Alamat Lengkap</label>
                       <textarea name="alamat" required rows="3" placeholder="Jalan, RT/RW, Desa/Kelurahan..." className="appearance-none w-full px-4 sm:px-7 py-3 sm:py-5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-black resize-none text-xs sm:text-base transition-shadow"></textarea>
                    </div>
                    <hr className="my-5 sm:my-10 border-slate-200 border-dashed w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 text-left leading-none w-full">
                      <div className="space-y-2 sm:space-y-3 w-full"><label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Program Kursus</label><select name="program" required className="w-full px-4 sm:px-7 py-3 sm:py-5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-3xl font-bold bg-white outline-none leading-none text-black text-xs sm:text-base transition-shadow min-h-[44px]"><option value="">-- Pilih Jurusan --</option>{PROGRAM_CHOICES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                      <div className="space-y-2 sm:space-y-3 w-full">
                         <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Kategori Kelas</label>
                         <select name="category" required className="w-full px-4 sm:px-7 py-3 sm:py-5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-3xl font-bold bg-white outline-none leading-none text-black text-xs sm:text-base transition-shadow min-h-[44px]">
                            <option value="">-- Pilih Kategori --</option>
                            <option value="Reguler">Reguler</option>
                            <option value="Private">Private</option>
                         </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 text-left leading-none w-full">
                      <div className="space-y-2 sm:space-y-3 w-full">
                         <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Jam Belajar</label>
                         <select name="jamBelajar" required className="w-full px-4 sm:px-7 py-3 sm:py-5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-3xl font-bold bg-white outline-none leading-none text-black text-xs sm:text-base transition-shadow min-h-[44px]">
                            <option value="">-- Pilih Jam --</option>
                            {JAM_BELAJAR_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2 sm:space-y-3 w-full"><label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Tanggal Mulai</label><input name="tanggalMulaiBelajar" required type="date" className="appearance-none w-full px-4 sm:px-7 py-3 sm:py-5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-3xl font-bold outline-none text-black text-xs sm:text-base transition-shadow min-h-[44px]" /></div>
                    </div>
                    <button type="submit" className="w-full py-4 sm:py-7 bg-blue-600 text-white font-black rounded-xl sm:rounded-[2.5rem] shadow-xl hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest text-[10px] sm:text-[11px] leading-none text-center mt-2 sm:mt-0 shrink-0 block">Hantar Pendaftaran</button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB DATABASE HIERARKI */}
            {activeTab === 'database' && (
              <div className="animate-in fade-in duration-700 relative text-left leading-none text-left w-full min-w-0">
                
                {/* Level 0: Pilih Status */}
                {!dbViewStatus && (
                   <div className="space-y-6 sm:space-y-12 max-w-5xl mx-auto px-1 sm:px-0">
                      <div className="text-center leading-none text-center bg-white p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border border-slate-200 shadow-sm min-w-0 flex flex-col items-center">
                        <Database size={40} className="sm:w-12 sm:h-12 mx-auto text-blue-500 mb-4 sm:mb-6 shrink-0" />
                        <h2 className="text-2xl sm:text-5xl font-black text-slate-800 tracking-tighter uppercase mb-2 sm:mb-4 leading-tight text-black text-center w-full break-words">Master Database</h2>
                        <p className="text-slate-400 text-[8px] sm:text-sm font-bold uppercase tracking-[0.1em] sm:tracking-[0.3em] leading-normal text-center w-full">Pilih Status Siswa Untuk Membuka Direktori</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full">
                         <div onClick={() => setDbViewStatus('Aktif')} className="bg-blue-500 text-white p-6 sm:p-12 rounded-3xl sm:rounded-[3rem] shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 cursor-pointer flex sm:flex-col items-center justify-start sm:justify-center gap-4 sm:gap-4 border-2 sm:border-4 border-white group w-full">
                            <div className="bg-white/20 p-3 sm:p-0 sm:bg-transparent rounded-xl sm:rounded-none shrink-0"><Users size={32} className="sm:w-12 sm:h-12 opacity-90 sm:opacity-80 group-hover:scale-110 transition-transform shrink-0" /></div>
                            <h3 className="text-sm sm:text-xl font-black uppercase tracking-widest text-left sm:text-center w-full sm:w-auto">Siswa Aktif</h3>
                         </div>
                         <div onClick={() => setDbViewStatus('Lulus')} className="bg-amber-500 text-white p-6 sm:p-12 rounded-3xl sm:rounded-[3rem] shadow-lg hover:shadow-amber-500/30 hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 cursor-pointer flex sm:flex-col items-center justify-start sm:justify-center gap-4 sm:gap-4 border-2 sm:border-4 border-white group w-full">
                            <div className="bg-white/20 p-3 sm:p-0 sm:bg-transparent rounded-xl sm:rounded-none shrink-0"><Award size={32} className="sm:w-12 sm:h-12 opacity-90 sm:opacity-80 group-hover:scale-110 transition-transform shrink-0" /></div>
                            <h3 className="text-sm sm:text-xl font-black uppercase tracking-widest text-left sm:text-center w-full sm:w-auto">Lulusan</h3>
                         </div>
                         <div onClick={() => setDbViewStatus('Non-Aktif')} className="bg-red-500 text-white p-6 sm:p-12 rounded-3xl sm:rounded-[3rem] shadow-lg hover:shadow-red-500/30 hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 cursor-pointer flex sm:flex-col items-center justify-start sm:justify-center gap-4 sm:gap-4 border-2 sm:border-4 border-white group w-full">
                            <div className="bg-white/20 p-3 sm:p-0 sm:bg-transparent rounded-xl sm:rounded-none shrink-0"><AlertCircle size={32} className="sm:w-12 sm:h-12 opacity-90 sm:opacity-80 group-hover:scale-110 transition-transform shrink-0" /></div>
                            <h3 className="text-sm sm:text-xl font-black uppercase tracking-widest text-left sm:text-center w-full sm:w-auto">Tidak Aktif</h3>
                         </div>
                      </div>
                   </div>
                )}

                {/* Level 1: Pilih Program */}
                {dbViewStatus && !dbViewProgram && (
                   <div className="space-y-5 sm:space-y-8 animate-in slide-in-from-right-8 duration-500 w-full min-w-0">
                      <div className="flex items-center gap-3 sm:gap-6 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0 min-w-0 w-full">
                         <button onClick={() => setDbViewStatus(null)} className="p-2.5 sm:p-3 bg-slate-50 rounded-xl hover:bg-blue-100 hover:text-blue-600 transition-colors text-slate-400 border border-slate-200 shrink-0"><ChevronLeft size={18} className="sm:w-5 sm:h-5 shrink-0" /></button>
                         <div className="min-w-0 flex-1">
                            <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Direktori Status</p>
                            <h2 className="text-lg sm:text-2xl font-black text-slate-800 uppercase tracking-tight truncate">{dbViewStatus}</h2>
                         </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 w-full">
                         {PROGRAM_CHOICES.map((course, idx) => {
                            const count = participants.filter(p => p.status === dbViewStatus && p.program === course).length;
                            return (
                               <div key={idx} onClick={() => setDbViewProgram(course)} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 cursor-pointer flex justify-between items-center group min-w-0 w-full gap-3">
                                  <h3 className="text-xs sm:text-sm font-black text-slate-700 group-hover:text-blue-700 uppercase tracking-tight min-w-0 flex-1 truncate">{course.split(' (')[0]}</h3>
                                  <span className="bg-slate-100 text-slate-500 px-2.5 sm:px-3 py-1.5 rounded-lg font-black text-[9px] sm:text-[10px] uppercase group-hover:bg-blue-200 group-hover:text-blue-800 transition-colors shrink-0 whitespace-nowrap">
                                     {count} Siswa
                                  </span>
                               </div>
                            )
                         })}
                      </div>
                   </div>
                )}

                {/* Level 2: Pilih Kategori */}
                {dbViewStatus && dbViewProgram && !dbViewCategory && (
                   <div className="space-y-5 sm:space-y-8 animate-in slide-in-from-right-8 duration-500 w-full min-w-0">
                      <div className="flex items-center gap-3 sm:gap-6 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0 min-w-0 w-full">
                         <button onClick={() => setDbViewProgram(null)} className="p-2.5 sm:p-3 bg-slate-50 rounded-xl hover:bg-blue-100 hover:text-blue-600 transition-colors text-slate-400 border border-slate-200 shrink-0"><ChevronLeft size={18} className="sm:w-5 sm:h-5 shrink-0" /></button>
                         <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 sm:gap-3 mb-1 min-w-0">
                               <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">{dbViewStatus}</span>
                               <ChevronRight size={10} className="text-slate-300 shrink-0" />
                            </div>
                            <h2 className="text-base sm:text-xl font-black text-slate-800 uppercase leading-tight truncate w-full">{dbViewProgram.split(' (')[0]}</h2>
                         </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 max-w-4xl mx-auto w-full">
                         <div onClick={() => setDbViewCategory('Reguler')} className="flex-1 bg-gradient-to-br from-blue-500 to-blue-700 text-white p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-lg hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col items-center text-center gap-3 sm:gap-4 border-2 sm:border-4 border-white relative overflow-hidden group w-full">
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                            <Users size={48} className="sm:w-[64px] sm:h-[64px] opacity-90 mb-1 sm:mb-2 relative z-10 shrink-0" />
                            <h3 className="text-xl sm:text-3xl font-black uppercase tracking-widest relative z-10">REGULER</h3>
                            <p className="text-[9px] sm:text-sm font-bold text-blue-100 uppercase tracking-widest relative z-10">Kelas Berkelompok</p>
                         </div>
                         <div onClick={() => setDbViewCategory('Private')} className="flex-1 bg-gradient-to-br from-purple-500 to-purple-700 text-white p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-lg hover:shadow-2xl hover:shadow-purple-500/40 hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col items-center text-center gap-3 sm:gap-4 border-2 sm:border-4 border-white relative overflow-hidden group w-full">
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                            <User size={48} className="sm:w-[64px] sm:h-[64px] opacity-90 mb-1 sm:mb-2 relative z-10 shrink-0" />
                            <h3 className="text-xl sm:text-3xl font-black uppercase tracking-widest relative z-10">PRIVATE</h3>
                            <p className="text-[9px] sm:text-sm font-bold text-purple-100 uppercase tracking-widest relative z-10">Kelas Perorangan</p>
                         </div>
                      </div>
                   </div>
                )}

                {/* Level 3: Table Peserta */}
                {dbViewStatus && dbViewProgram && dbViewCategory && (
                   <div className="space-y-5 sm:space-y-8 animate-in slide-in-from-right-8 duration-500 w-full min-w-0">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-6 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0 min-w-0 w-full">
                         <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
                             <button onClick={() => setDbViewCategory(null)} className="p-2.5 sm:p-3 bg-slate-50 rounded-xl hover:bg-blue-100 hover:text-blue-600 transition-colors text-slate-400 border border-slate-200 shrink-0"><ChevronLeft size={18} className="sm:w-5 sm:h-5 shrink-0" /></button>
                             <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1 min-w-0">
                                   <span className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">{dbViewStatus}</span>
                                   <ChevronRight size={10} className="text-slate-300 shrink-0 hidden sm:block" />
                                   <span className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">{dbViewCategory}</span>
                                </div>
                                <h2 className="text-sm sm:text-xl font-black text-slate-800 uppercase leading-tight truncate w-full">{dbViewProgram.split(' (')[0]}</h2>
                             </div>
                         </div>
                         {/* Pencarian */}
                         <div className="relative w-full lg:w-64 xl:w-80 shrink-0">
                            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 shrink-0" size={16} />
                            <input type="text" placeholder="Cari Nama Siswa..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="appearance-none w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all focus:shadow-md" />
                         </div>
                      </div>

                      <div className="bg-white rounded-2xl sm:rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden text-left leading-none w-full min-w-0">
                        <div className="overflow-x-auto text-left leading-none pb-2 sm:pb-0 min-h-[200px] md:min-h-[400px] w-full">
                          <table className="w-full text-left font-sans leading-none min-w-[600px]">
                            <thead className="bg-slate-100 border-b border-slate-200 font-black text-[9px] sm:text-[11px] uppercase text-slate-500 tracking-widest leading-none">
                              <tr>
                                <th className="p-4 sm:p-8 w-12 sm:w-20 text-center shrink-0">No</th>
                                <th className="p-4 sm:p-8 min-w-[200px]">Profil Siswa & Kontak</th>
                                <th className="p-4 sm:p-8 text-center w-28 sm:w-32 shrink-0">Status</th>
                                <th className="p-4 sm:p-8 text-center w-48 sm:w-64 shrink-0">Manajemen Data</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 leading-none">
                              {(() => {
                                  const filteredDb = participants.filter(p => {
                                      return p.status === dbViewStatus && 
                                             p.program === dbViewProgram && 
                                             p.category === dbViewCategory &&
                                             p.nama.toLowerCase().includes(searchQuery.toLowerCase());
                                  });

                                  if (filteredDb.length === 0) {
                                      return <tr><td colSpan="4" className="p-12 sm:p-32 text-center flex flex-col items-center justify-center border-none"><Database size={40} className="sm:w-12 sm:h-12 text-slate-200 mb-3 sm:mb-4 shrink-0"/><span className="font-black text-slate-400 uppercase tracking-widest text-[10px] sm:text-sm">Data Siswa Tidak Ditemukan</span></td></tr>;
                                  }

                                  return filteredDb.map((p, i) => (
                                     <tr key={p.id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="p-4 sm:p-8 text-slate-400 font-bold font-mono text-center text-xs sm:text-base shrink-0">{i + 1}</td>
                                        <td className="p-4 sm:p-8 flex items-center gap-3 sm:gap-6 cursor-pointer min-w-0" onClick={() => handleOpenDetail(p)}>
                                          <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm bg-white flex items-center justify-center overflow-hidden shrink-0 group-hover:border-blue-300 transition-colors">
                                            {p.photo ? <img src={p.photo} className="w-full h-full object-cover shrink-0" /> : <img src={IKON_GENDER[p.gender]} className="w-5 h-5 sm:w-8 sm:h-8 opacity-30 shrink-0" />}
                                          </div>
                                          <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0 flex-1">
                                             <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-xs sm:text-base font-black uppercase text-slate-800 group-hover:text-blue-700 transition-colors truncate w-full">{p.nama}</span>
                                             </div>
                                             <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-[8px] sm:text-[10px] font-bold text-slate-500 min-w-0">
                                                <span className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 px-2 py-1 sm:px-2.5 rounded-md border border-slate-200 w-fit shrink-0"><img src={LOGO_WA} className="w-2 h-2 sm:w-3 sm:h-3 shrink-0" />{p.telepon}</span>
                                             </div>
                                          </div>
                                        </td>
                                        <td className="p-4 sm:p-8 text-center shrink-0">
                                           <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-full text-[7px] sm:text-[10px] font-black tracking-widest uppercase border whitespace-nowrap ${p.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : p.status === 'Lulus' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{p.status}</span>
                                        </td>
                                        <td className="p-4 sm:p-8 text-center shrink-0">
                                          <div className="flex items-center justify-center gap-1.5 sm:gap-3 shrink-0">
                                            <button onClick={() => handleOpenDetail(p)} title="Profil Detail" className="p-2 sm:p-3.5 bg-white border border-slate-200 text-slate-600 rounded-lg sm:rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm hover:shadow-md shrink-0"><User size={14} className="sm:w-5 sm:h-5 shrink-0" /></button>
                                            <button onClick={() => handleOpenEditProfile(p)} title="Edit Profil Lengkap" className="p-2 sm:p-3.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg sm:rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm hover:shadow-md shrink-0"><Edit size={14} className="sm:w-5 sm:h-5 shrink-0" /></button>
                                            <button onClick={() => handleOpenNilai(p)} title="Input Nilai" className="p-2 sm:p-3.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg sm:rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:shadow-md shrink-0"><Award size={14} className="sm:w-5 sm:h-5 shrink-0" /></button>
                                            {/* Cetak PDF Hanya Muncul Jika Lulus */}
                                            {p.status === 'Lulus' && (
                                                <button onClick={() => handleDirectPrint(p)} title="Cetak Transkrip" className="p-2 sm:p-3.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg sm:rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm hover:shadow-md shrink-0"><Printer size={14} className="sm:w-5 sm:h-5 shrink-0" /></button>
                                            )}
                                          </div>
                                        </td>
                                     </tr>
                                  ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                   </div>
                )}
                
                {/* TOMBOL UNDUH & IMPORT CSV GLOBAL UNTUK DATABASE */}
                <div className="fixed bottom-6 right-6 sm:bottom-12 sm:right-12 flex flex-col items-center gap-3 sm:gap-5 z-[80] group leading-none text-left">
                    
                    {/* Tombol Import CSV */}
                    <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 leading-none">
                      <label className={`w-10 h-10 sm:w-16 sm:h-16 bg-emerald-600 text-white rounded-full shadow-lg sm:shadow-xl flex items-center justify-center border-2 sm:border-4 border-white shadow-slate-200 relative hover:scale-105 transition-transform shrink-0 ${isImporting ? 'cursor-wait opacity-50' : 'cursor-pointer'} group/btn2`}>
                         <Upload size={16} className="sm:w-7 sm:h-7 shrink-0" />
                         <div className="absolute right-14 sm:right-24 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900 text-white text-[8px] sm:text-[11px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/btn2:opacity-100 transition-opacity whitespace-nowrap shadow-xl shrink-0 pointer-events-none">Import Data CSV</div>
                         <input type="file" accept=".csv" onChange={handleImportCSV} disabled={isImporting} className="hidden" />
                      </label>
                    </div>

                    {/* Tombol Download CSV */}
                    <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 leading-none delay-75">
                      <button onClick={handleDownloadExcel} className="w-10 h-10 sm:w-16 sm:h-16 bg-slate-900 text-white rounded-full shadow-lg sm:shadow-xl flex items-center justify-center border-2 sm:border-4 border-white shadow-slate-200 group/btn relative hover:scale-105 transition-transform shrink-0">
                         <Download size={16} className="sm:w-7 sm:h-7 shrink-0" />
                         <div className="absolute right-14 sm:right-24 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900 text-white text-[8px] sm:text-[11px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap shadow-xl shrink-0 pointer-events-none">Unduh Laporan CSV</div>
                      </button>
                    </div>
                    
                    {/* Tombol Induk Database */}
                    <button className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center border-2 sm:border-4 border-white leading-none relative group/main text-white hover:bg-blue-700 transition-colors shrink-0">
                      <Database size={20} className="sm:w-7 sm:h-7 shrink-0" />
                    </button>
                </div>

              </div>
            )}

            {/* TAB ABSENSI REGULER (NEW DAILY FORM WORKFLOW) */}
            {activeTab === 'absensi_reguler' && (
              <div className="animate-in fade-in duration-700 space-y-6 sm:space-y-8 w-full max-w-5xl mx-auto px-1 sm:px-0">
                 
                 {/* Header Label */}
                 <div className="bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-4 sm:gap-6 min-w-0 w-full">
                     <div className="w-12 h-12 sm:w-16 sm:h-16 bg-teal-100 text-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                        <CalendarCheck size={28} className="sm:w-8 sm:h-8 shrink-0" />
                     </div>
                     <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-3xl font-black text-slate-800 uppercase tracking-tighter truncate w-full">Input Absensi Reguler</h2>
                        <p className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate w-full">Pencatatan Kehadiran Sesi Harian</p>
                     </div>
                 </div>

                 {/* Form Info Instruktur & Input Peserta */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    
                    {/* KIRI: INFO INSTRUKTUR */}
                    <div className="bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 shadow-sm space-y-4 sm:space-y-5 min-w-0 w-full">
                       <h3 className="font-black text-slate-800 uppercase text-xs sm:text-sm border-b border-slate-100 pb-2.5 sm:pb-3 mb-2 sm:mb-4">1. Informasi Sesi Mengajar</h3>
                       <div className="space-y-1.5 sm:space-y-2 w-full">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block">Instruktur Utama</label>
                          <input type="text" value="Jamaludin Dwi Laspandi" disabled className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl font-bold text-slate-600 text-xs sm:text-sm cursor-not-allowed appearance-none" />
                       </div>
                       <div className="space-y-1.5 sm:space-y-2 w-full">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block">Instruktur Piket / Asisten</label>
                          <select value={piketReguler} onChange={(e) => setPiketReguler(e.target.value)} className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl font-bold text-slate-800 text-xs sm:text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 transition-all cursor-pointer appearance-none min-h-[40px]">
                             <option value="">-- Pilih Nama Instruktur Piket --</option>
                             {DAFTAR_PIKET.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                       </div>
                       <div className="space-y-1.5 sm:space-y-2 w-full">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tanggal Kehadiran</label>
                          <input type="text" value={new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} disabled className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl font-bold text-slate-600 text-xs sm:text-sm appearance-none" />
                       </div>
                    </div>

                    {/* KANAN: INPUT PESERTA */}
                    <div className="bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 shadow-sm space-y-4 sm:space-y-5 flex flex-col min-w-0 w-full">
                       <h3 className="font-black text-slate-800 uppercase text-xs sm:text-sm border-b border-slate-100 pb-2.5 sm:pb-3 mb-2 sm:mb-4">2. Tambahkan Siswa Hadir</h3>
                       <div className="space-y-1.5 sm:space-y-2 flex-grow w-full">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cari & Pilih Nama Peserta Aktif</label>
                          <select value={selectedStudentForAbsen} onChange={(e) => setSelectedStudentForAbsen(e.target.value)} className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl font-bold text-slate-800 text-xs sm:text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 transition-all cursor-pointer appearance-none min-h-[40px]">
                             <option value="">-- Buka Untuk Memilih Peserta --</option>
                             {activeRegulerParticipants.map(p => {
                                 const isAdded = dailyAttendees.some(a => a.id === p.id);
                                 const maxExisting = (p.absensi || []).reduce((max, a) => Math.max(max, a.pertemuan), 0);
                                 return (
                                    <option key={p.id} value={p.id} disabled={isAdded}>
                                       {p.nama} {isAdded ? '(Sudah Ditambahkan)' : `- Ke-${maxExisting + 1}`}
                                    </option>
                                 )
                             })}
                          </select>
                       </div>
                       
                       {/* Detail Selected Student */}
                       <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 min-h-[80px] w-full">
                           {selectedStudentData ? (
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="min-w-0">
                                      <p className="text-[8px] sm:text-[9px] font-black text-teal-600 uppercase tracking-widest mb-1 truncate">Program Kelas</p>
                                      <p className="font-bold text-teal-950 text-[10px] sm:text-xs truncate">{selectedStudentData.program.split(' (')[0]}</p>
                                   </div>
                                   <div className="min-w-0">
                                      <p className="text-[8px] sm:text-[9px] font-black text-teal-600 uppercase tracking-widest mb-1 truncate">Status Pertemuan</p>
                                      <p className="font-bold text-teal-950 text-[10px] sm:text-xs truncate">Total: {getPertemuanCount(selectedStudentData.program)}x (Hadir: {selectedStudentData.absensi?.length || 0}x)</p>
                                   </div>
                               </div>
                           ) : (
                               <div className="flex items-center justify-center h-full text-[10px] sm:text-xs font-bold text-teal-600/50 italic text-center px-4">Pilih nama siswa di atas untuk melihat detail program.</div>
                           )}
                       </div>

                       <button onClick={handleAddDailyAttendee} disabled={!selectedStudentForAbsen} className="w-full py-3.5 sm:py-4 bg-teal-500 text-white font-black rounded-lg sm:rounded-xl hover:bg-teal-600 active:scale-[0.98] transition-all uppercase tracking-widest text-[9px] sm:text-[10px] disabled:opacity-50 disabled:cursor-not-allowed mt-auto flex items-center justify-center gap-2 shrink-0">
                           <Plus size={16} className="shrink-0" /> Tambah Ke Daftar Hadir
                       </button>
                    </div>
                 </div>

                 {/* DAFTAR HADIR SEMENTARA */}
                 <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden w-full min-w-0">
                    <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                        <div className="min-w-0">
                            <h3 className="font-black text-slate-800 uppercase text-xs sm:text-sm truncate">Daftar Kehadiran Sesi Ini</h3>
                            <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">Total: {dailyAttendees.length} Siswa Ditambahkan</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto min-h-[150px] w-full">
                        <table className="w-full text-left font-sans min-w-[600px]">
                            <thead className="bg-white border-b border-slate-100 font-black text-[9px] sm:text-[10px] uppercase text-slate-400 tracking-widest">
                                <tr>
                                    <th className="p-3 sm:p-4 w-12 sm:w-16 text-center shrink-0">No</th>
                                    <th className="p-3 sm:p-4">Nama Peserta</th>
                                    <th className="p-3 sm:p-4">Program</th>
                                    <th className="p-3 sm:p-4 text-center w-36 sm:w-40 shrink-0">Pertemuan Ke (Edit)</th>
                                    <th className="p-3 sm:p-4 text-center w-20 sm:w-24 shrink-0">Batal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {dailyAttendees.length === 0 ? (
                                    <tr><td colSpan="5" className="p-12 sm:p-16 text-center font-black text-slate-300 text-[10px] sm:text-xs italic">Belum ada peserta yang dimasukkan ke daftar hadir</td></tr>
                                ) : (
                                    dailyAttendees.map((p, i) => (
                                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-3 sm:p-4 text-center font-bold text-slate-400 text-xs sm:text-sm">{i + 1}</td>
                                            <td className="p-3 sm:p-4 font-black uppercase text-slate-800 text-[10px] sm:text-sm">{p.nama}</td>
                                            <td className="p-3 sm:p-4 font-bold text-slate-500 text-[9px] sm:text-xs">{p.program.split(' (')[0]}</td>
                                            <td className="p-3 sm:p-4 text-center">
                                               <div className="flex items-center justify-center gap-2">
                                                   <span className="text-[10px] font-bold text-slate-400">Ke-</span>
                                                   <input 
                                                      type="number" 
                                                      min="1"
                                                      value={p.inputPertemuan}
                                                      onChange={(e) => handleUpdateMeetingNumber(p.id, e.target.value)}
                                                      className="appearance-none w-14 sm:w-16 text-center font-black text-teal-700 bg-teal-50 px-2 py-1.5 rounded-lg text-xs sm:text-sm border border-teal-200 outline-none focus:ring-2 focus:ring-teal-500 transition-all shadow-inner"
                                                      title="Kamu bisa mengubah angka ini untuk mem-balance jumlah absensi lama"
                                                   />
                                               </div>
                                            </td>
                                            <td className="p-3 sm:p-4 text-center">
                                                <button onClick={() => handleRemoveDailyAttendee(p.id)} className="p-2 sm:p-2.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                                                    <Trash2 size={14} className="sm:w-[16px] sm:h-[16px]" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* ACTION BUTTON */}
                    <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0 w-full">
                        <button onClick={handleSaveDailyAttendance} disabled={dailyAttendees.length === 0} className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-teal-600 active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] sm:text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 sm:gap-3 shrink-0">
                            <Save size={16} className="sm:w-[18px] sm:h-[18px] shrink-0" /> Simpan & Rekam Semua Absensi
                        </button>
                    </div>
                 </div>
              </div>
            )}

            {/* TAB ABSENSI PRIVATE (TETAP MENGGUNAKAN KOTAK PER-SISWA) */}
            {activeTab === 'absensi_private' && (
              <div className="animate-in fade-in duration-700 relative text-left leading-none text-left w-full min-w-0">
                {!selectedAbsensiCourse ? (
                  <div className="space-y-6 sm:space-y-12 leading-none text-left max-w-6xl mx-auto w-full px-1 sm:px-0">
                    <div className="text-center leading-none text-center bg-white p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center">
                      <CalendarDays size={40} className="sm:w-12 sm:h-12 mx-auto mb-4 sm:mb-6 shrink-0 text-purple-500" />
                      <h2 className="text-2xl sm:text-5xl font-black text-slate-800 tracking-tighter uppercase mb-2 sm:mb-4 leading-tight text-black w-full break-words text-center">Absensi Private</h2>
                      <p className="text-slate-400 text-[8px] sm:text-sm font-bold uppercase tracking-[0.1em] sm:tracking-[0.3em] leading-normal text-center w-full">Pilih Kelas Untuk Mengelola Kehadiran Personal</p>
                    </div>

                    {/* List Kelas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 w-full">
                      {PROGRAM_CHOICES.map((course, idx) => {
                        const count = participants.filter(p => p.program === course && p.category === 'Private' && p.status === 'Aktif').length;
                        return (
                          <div key={idx} onClick={() => setSelectedAbsensiCourse(course)} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex justify-between items-center group min-w-0 w-full gap-3 hover:border-purple-500 hover:bg-purple-50">
                             <h3 className="text-xs sm:text-sm font-black text-slate-700 uppercase tracking-tight min-w-0 flex-1 truncate group-hover:text-purple-700">
                                {course.split(' (')[0]}
                             </h3>
                             <span className="bg-slate-100 text-slate-500 px-2.5 sm:px-3 py-1.5 rounded-lg font-black text-[9px] sm:text-[10px] uppercase transition-colors shrink-0 whitespace-nowrap group-hover:bg-purple-200 group-hover:text-purple-800">
                                {count} Aktif
                             </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-[2rem] sm:rounded-[4rem] border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-right-8 duration-500 text-left leading-none w-full min-w-0">
                     <div className="p-4 sm:p-8 border-b border-slate-200 bg-slate-50 flex flex-col gap-4 sm:gap-6 text-black leading-none text-left shrink-0 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center gap-3 sm:gap-8 text-left text-black leading-none justify-between min-w-0 w-full">
                          <div className="flex items-center gap-3 sm:gap-6 min-w-0 w-full flex-1">
                            <button onClick={() => setSelectedAbsensiCourse(null)} className="p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl border border-slate-200 text-slate-400 transition-all shadow-sm flex items-center justify-center leading-none shrink-0 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"><ChevronLeft size={18} className="sm:w-6 sm:h-6 shrink-0" /></button>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-4 mb-1 sm:mb-2 min-w-0">
                                    <h2 className="text-sm sm:text-2xl font-black text-slate-800 uppercase leading-tight truncate w-full sm:w-auto">{selectedAbsensiCourse.split(' (')[0]}</h2>
                                    <span className="self-start px-2 sm:px-4 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[7px] sm:text-[10px] font-black tracking-widest text-white uppercase shadow-sm shrink-0 bg-purple-500">Private</span>
                                </div>
                                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-left truncate w-full text-purple-600">Manajemen Kelas Personal</p>
                            </div>
                          </div>
                      </div>
                    </div>
                    
                    <div className="p-3 sm:p-10 space-y-4 sm:space-y-10 bg-slate-50/30 w-full min-w-0">
                       {(() => {
                           const classParticipants = participants.filter(p => p.program === selectedAbsensiCourse && p.category === 'Private' && p.status === 'Aktif');
                           const displayedParticipants = classParticipants;
                           const totalPertemuan = getPertemuanCount(selectedAbsensiCourse);

                           const formatTgl = (tgl) => {
                               if(!tgl) return '';
                               const p = tgl.split('/');
                               return p.length >= 2 ? `${p[0]}/${p[1]}` : tgl;
                           };

                           if (displayedParticipants.length === 0) {
                               return <div className="p-8 sm:p-20 text-center font-black text-slate-300 uppercase tracking-widest text-[10px] sm:text-sm italic border-2 sm:border-4 border-dashed border-slate-200 rounded-2xl sm:rounded-[3rem] w-full mx-auto">Belum Ada Siswa Aktif di Kelas Ini</div>
                           }

                           return displayedParticipants.map((p, index) => {
                               const absensiSiswa = p.absensi || [];
                               const persentaseHadir = totalPertemuan > 0 ? Math.round((absensiSiswa.length / totalPertemuan) * 100) : 0;

                               return (
                                   <div key={p.id} className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-8 transition-all hover:shadow-md hover:border-purple-200 min-w-0 w-full">
                                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-6 border-b border-slate-100 pb-3 sm:pb-6 w-full min-w-0">
                                          <div className="flex items-center gap-3 sm:gap-6 min-w-0 w-full lg:w-auto flex-1">
                                              <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm sm:text-xl border border-purple-200 shadow-sm shrink-0">{index + 1}</div>
                                              <div className="min-w-0 flex-1">
                                                  <h3 className="text-sm sm:text-xl font-black uppercase text-slate-800 mb-1 sm:mb-2 truncate w-full">{p.nama}</h3>
                                                  <div className="flex flex-wrap sm:flex-nowrap sm:items-center gap-1.5 sm:gap-3 text-[7px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest min-w-0">
                                                      <span className="bg-slate-100 px-2 py-1 rounded-md shrink-0 truncate max-w-full">{p.program.split(' (')[0]}</span>
                                                      <span className="hidden sm:block w-1 h-1 sm:w-1.5 sm:h-1.5 bg-slate-300 rounded-full shrink-0"></span>
                                                      <span className={`px-2 py-1 rounded-md border shrink-0 whitespace-nowrap ${persentaseHadir < 50 ? 'bg-red-50 text-red-600 border-red-100' : persentaseHadir < 80 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>Kehadiran: {absensiSiswa.length}/{totalPertemuan} ({persentaseHadir}%)</span>
                                                  </div>
                                              </div>
                                          </div>
                                          
                                          <div className="flex items-center gap-2 sm:gap-3 bg-purple-50 px-3 sm:px-6 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl border border-purple-200 w-full lg:w-auto shadow-sm shrink-0 mt-2 lg:mt-0">
                                              <User size={14} className="sm:w-4 sm:h-4 text-purple-500 shrink-0" />
                                              <input 
                                                  type="text" 
                                                  placeholder="Ketik Nama Pengajar..." 
                                                  defaultValue={p.pengajarPrivate || ''}
                                                  onBlur={(e) => handleUpdatePengajarPrivate(p.id, e.target.value)}
                                                  className="appearance-none bg-transparent border-none outline-none font-black text-[10px] sm:text-sm text-purple-900 placeholder:text-purple-300 w-full"
                                              />
                                          </div>
                                      </div>

                                      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 sm:gap-4 w-full">
                                          {Array.from({ length: totalPertemuan }, (_, i) => i + 1).map(pertemuanKe => {
                                              const isHadir = absensiSiswa.find(a => a.pertemuan === pertemuanKe);
                                              return (
                                                  <button 
                                                      key={pertemuanKe}
                                                      onClick={() => handleToggleAbsenPrivate(p.id, pertemuanKe, !!isHadir)}
                                                      className={`relative group flex flex-col items-center justify-center py-2.5 sm:py-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 overflow-hidden shrink-0 ${isHadir ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-purple-300 hover:bg-slate-50'}`}
                                                  >
                                                      <span className="text-[8px] sm:text-[12px] font-black uppercase tracking-wider opacity-80 mb-1 sm:mb-1.5">P{pertemuanKe}</span>
                                                      {isHadir ? (
                                                          <span className="text-[7px] sm:text-[11px] font-bold text-purple-600 bg-white/50 px-0.5 sm:px-1 rounded shrink-0">{formatTgl(isHadir.tanggal)}</span>
                                                      ) : (
                                                          <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-[3px] sm:rounded-[4px] border-2 border-slate-300 group-hover:border-purple-300 transition-colors shrink-0"></div>
                                                      )}
                                                  </button>
                                              )
                                          })}
                                      </div>
                                   </div>
                               );
                           });
                       })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB ARSIP SERTIFIKAT (STABIL) */}
            {activeTab === 'certificates' && (
               <div className="animate-in fade-in leading-none text-left w-full min-w-0">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-12 gap-4 sm:gap-8 text-left leading-none text-left bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-slate-200 shadow-sm w-full min-w-0">
                    <div className="text-left leading-none text-left flex items-center gap-4 sm:gap-6 min-w-0 w-full md:w-auto">
                       <div className="flex w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 text-amber-600 rounded-xl sm:rounded-2xl items-center justify-center shrink-0">
                          <FileCheck size={24} className="sm:w-8 sm:h-8 shrink-0" />
                       </div>
                       <div className="min-w-0 flex-1">
                         <h2 className="text-xl sm:text-4xl font-black text-slate-800 uppercase tracking-tighter mb-1 sm:mb-3 truncate w-full">Archive Sertifikat</h2>
                         <p className="text-slate-400 text-[8px] sm:text-sm font-bold uppercase tracking-widest leading-none text-left truncate w-full">Pusat Backup Dokumen PDF Digital</p>
                       </div>
                    </div>
                    <button onClick={() => setIsUploadModalOpen(true)} className="p-3.5 sm:p-5 bg-amber-500 text-white rounded-xl sm:rounded-2xl shadow-lg hover:bg-amber-600 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2 sm:gap-3 leading-none w-full md:w-auto justify-center group shrink-0 mt-2 md:mt-0"><CloudUpload size={16} className="sm:w-5 sm:h-5 shrink-0 group-hover:animate-bounce" /><span className="font-black text-[9px] sm:text-[11px] uppercase tracking-widest leading-none shrink-0">Upload Backup PDF</span></button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8 leading-none w-full min-w-0">
                    {certificates.length === 0 ? (
                        <div className="col-span-full p-12 sm:p-24 text-center flex flex-col items-center border-2 border-dashed border-slate-200 rounded-[2rem] sm:rounded-[3rem] bg-white">
                           <FolderArchive size={36} className="sm:w-12 sm:h-12 text-slate-300 mb-3 sm:mb-4 shrink-0" />
                           <span className="font-black text-slate-400 uppercase tracking-widest text-[9px] sm:text-sm">Belum Ada Arsip Sertifikat</span>
                        </div>
                    ) : (
                      certificates.map(cert => (
                        <div key={cert.id} className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-200 sm:hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center text-center leading-none text-left relative overflow-hidden min-w-0 w-full">
                          <div className="w-12 h-12 sm:w-20 sm:h-20 bg-slate-50 text-red-500 rounded-xl sm:rounded-[2rem] flex items-center justify-center mb-3 sm:mb-6 border border-slate-200 group-hover:bg-red-500 group-hover:text-white group-hover:border-red-500 transition-colors shadow-sm leading-none text-left relative z-10 shrink-0"><File size={18} className="sm:w-8 sm:h-8 shrink-0" /></div>
                          <h3 className="font-black text-slate-800 uppercase text-center text-[10px] sm:text-sm mb-1.5 sm:mb-2 leading-tight h-6 sm:h-10 flex items-center justify-center text-left line-clamp-2 relative z-10 w-full">{cert.namaSiswa}</h3>
                          <p className="text-[7px] sm:text-[9px] font-bold text-slate-400 uppercase mb-3 sm:mb-6 leading-none text-center line-clamp-1 px-1 sm:px-2 relative z-10 w-full">{cert.program}</p>
                          <div className="w-full bg-slate-50 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 mb-3 sm:mb-6 flex flex-col items-center text-center leading-none text-left relative z-10 min-w-0">
                             <span className="text-[6px] sm:text-[8px] font-black text-slate-400 uppercase leading-none mb-1 sm:mb-1.5 text-center tracking-widest shrink-0">NOMOR SERTIFIKAT</span>
                             <span className="text-[8px] sm:text-[11px] font-black text-slate-700 leading-none text-center break-all w-full">{cert.noSertifikat}</span>
                          </div>
                          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-3 w-full leading-none text-left relative z-10 mt-auto min-w-0">
                             <a href={cert.fileUrl} download={cert.fileName} className="py-2.5 sm:py-3.5 bg-slate-900 text-white rounded-lg sm:rounded-xl font-black text-[8px] sm:text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 leading-none text-left shadow-sm hover:shadow-md shrink-0"><Download size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="hidden sm:inline">Download</span><span className="sm:hidden">Unduh</span></a>
                             <button onClick={() => window.print()} className="py-2.5 sm:py-3.5 bg-amber-500 text-white rounded-lg sm:rounded-xl font-black text-[8px] sm:text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 leading-none text-left shadow-sm hover:shadow-md shrink-0"><Printer size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" /> Print</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
               </div>
            )}
          </main>
        </div>

        {/* --- MODAL UPLOAD SERTIFIKAT --- */}
        {isUploadModalOpen && (
           <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setIsUploadModalOpen(false)} />
             <div className="relative bg-white w-full max-w-xl rounded-3xl sm:rounded-[4rem] shadow-2xl overflow-hidden flex flex-col border-4 sm:border-8 border-slate-50 animate-in zoom-in-95 leading-none text-left">
                <div className="bg-amber-500 p-6 sm:p-10 text-white flex justify-between items-center leading-none text-white text-left shrink-0">
                   <div className="leading-none text-left text-white text-left min-w-0">
                      <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white truncate">Upload Backup</h3>
                      <p className="text-[9px] sm:text-[10px] text-amber-100 mt-1.5 sm:mt-2 font-sans text-white uppercase text-left tracking-widest truncate">Arsip Sertifikat PDF</p>
                   </div>
                   <button onClick={() => setIsUploadModalOpen(false)} className="text-white text-left hover:rotate-90 transition-transform shrink-0 ml-4"><X size={24} className="sm:w-7 sm:h-7 shrink-0" /></button>
                </div>
                <form onSubmit={handleUploadCert} className="p-6 sm:p-10 space-y-4 sm:space-y-6 flex flex-col text-left leading-none text-black text-left w-full min-w-0 overflow-y-auto max-h-[70vh]">
                   <div className="space-y-2 sm:space-y-3 leading-none text-left text-black w-full">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Nama Siswa</label>
                      <input name="namaSiswa" required type="text" className="appearance-none w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none focus:border-amber-400 font-bold text-black uppercase text-xs sm:text-sm transition-colors" />
                   </div>
                   <div className="space-y-2 sm:space-y-3 leading-none text-left text-black w-full">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">No. Sertifikat</label>
                      <input name="noSertifikat" required type="text" className="appearance-none w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none focus:border-amber-400 font-bold text-black uppercase text-xs sm:text-sm transition-colors" />
                   </div>
                   <div className="space-y-2 sm:space-y-3 leading-none text-left text-black w-full">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Program</label>
                      <select name="program" required className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none focus:border-amber-400 font-bold bg-white text-black text-xs sm:text-sm transition-colors min-h-[44px]">
                         {PROGRAM_CHOICES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2 sm:space-y-3 leading-none text-left text-black w-full">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">File Dokumen (.PDF / Gambar)</label>
                      <input name="file" required type="file" accept=".pdf,image/*" className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none font-bold text-black file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-4 sm:file:px-5 file:rounded-lg sm:file:rounded-full file:border-0 file:text-[8px] sm:file:text-[10px] file:font-black file:uppercase file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 text-[10px] sm:text-xs transition-colors cursor-pointer" />
                   </div>
                   <button type="submit" className="w-full py-4 sm:py-5 bg-slate-900 text-white font-black rounded-xl sm:rounded-2xl shadow-xl uppercase tracking-widest text-[9px] sm:text-[10px] hover:bg-amber-500 hover:-translate-y-1 transition-all leading-none mt-2 sm:mt-6 text-white text-center shrink-0 block">Simpan ke Arsip Cloud</button>
                </form>
             </div>
          </div>
        )}

        {/* Modal Input Nilai Portrait */}
        {isNilaiModalOpen && selectedParticipant && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 leading-none text-left">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsNilaiModalOpen(false)} />
            <div className="relative bg-white w-full max-w-xl rounded-3xl sm:rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-4 sm:border-8 border-slate-50 animate-in zoom-in-95 leading-none text-black text-left">
              <div className="bg-slate-950 p-5 sm:p-10 text-white flex justify-between items-center shrink-0 leading-none text-white text-left">
                <div className="text-left leading-none text-white text-left text-white overflow-hidden w-[85%] min-w-0">
                   <h3 className="text-lg sm:text-2xl font-black tracking-tighter uppercase leading-none mb-1.5 sm:mb-3 text-left text-white truncate">Input Skor Penilaian</h3>
                   <span className="text-[7px] sm:text-[9px] text-slate-400 tracking-[0.1em] sm:tracking-[0.4em] font-sans uppercase text-left text-slate-400 truncate block">SISWA: {selectedParticipant.nama}</span>
                </div>
                <button onClick={() => setIsNilaiModalOpen(false)} className="text-white leading-none text-white shrink-0 hover:rotate-90 transition-transform ml-2"><X size={20} className="sm:w-6 sm:h-6 shrink-0" /></button>
              </div>
              <form onSubmit={handleSaveNilai} className="flex flex-col overflow-hidden flex-grow leading-normal text-left text-black text-left">
                <div className="p-4 sm:p-10 overflow-y-auto flex-grow leading-none text-left text-black text-left bg-slate-50/50 w-full min-w-0">
                   <div className="flex flex-col gap-3 sm:gap-4 text-left text-black leading-none text-left text-black w-full min-w-0">
                      {tempNilai.map((item, index) => (
                        <div key={index} className="flex items-center gap-2.5 sm:gap-5 bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-[2rem] border border-slate-200 leading-none transition-all hover:border-blue-300 shadow-sm hover:shadow-md group text-left w-full min-w-0">
                           <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center font-black text-slate-400 text-[10px] sm:text-xs leading-none shrink-0 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors text-left">{index + 1}</div>
                           <span className="flex-grow font-black text-[9px] sm:text-[12px] uppercase text-slate-800 leading-tight sm:leading-none text-left group-hover:text-blue-900 transition-colors break-words min-w-0">{item.materi}</span>
                           <input type="number" min="0" max="100" required value={item.skor} onChange={(e) => { const n = [...tempNilai]; n[index].skor = e.target.value; setTempNilai(n); }} className="appearance-none w-14 sm:w-20 px-2 py-2.5 sm:py-4 rounded-lg sm:rounded-[1.25rem] border-2 border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-center font-black text-sm sm:text-lg bg-slate-50 shadow-inner text-black leading-none transition-all shrink-0" placeholder="0" />
                        </div>
                      ))}
                   </div>
                </div>
                <div className="p-4 sm:p-8 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 shrink-0 leading-none text-black z-10 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] w-full">
                    <button type="button" onClick={() => setIsNilaiModalOpen(false)} className="px-6 sm:px-8 py-3.5 sm:py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] text-slate-600 text-center w-full sm:w-auto uppercase tracking-widest transition-colors shrink-0">Batal</button>
                    <button type="submit" className="px-8 sm:px-10 py-3.5 sm:py-4 bg-blue-600 text-white font-black rounded-xl sm:rounded-2xl hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all uppercase tracking-widest text-[10px] sm:text-[11px] text-white text-center w-full sm:w-auto flex items-center justify-center gap-2 shrink-0"><Save size={16} className="shrink-0" /> Luluskan Siswa</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Profil Terpadu (Detail & Edit Status) */}
        {isDetailModalOpen && selectedParticipant && (
          <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 text-left leading-none text-left">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsDetailModalOpen(false)} />
            <div className="relative bg-white w-full max-w-5xl rounded-3xl sm:rounded-[4.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col md:flex-row max-h-[90vh] border-4 sm:border-[15px] border-slate-100 leading-none text-left">
              
              {/* KOLOM KIRI: FOTO & MANAJEMEN STATUS */}
              <div className="w-full md:w-[380px] bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col items-center p-6 sm:p-12 shrink-0 overflow-y-auto leading-none text-left text-left max-h-[45vh] md:max-h-full min-w-0">
                 
                 {/* Upload Foto Langsung */}
                 <div className="relative mb-4 sm:mb-8 group shrink-0">
                    <div className="w-24 h-24 sm:w-40 sm:h-40 bg-white rounded-full flex items-center justify-center border-4 sm:border-[6px] border-white shadow-xl shrink-0 leading-none text-slate-200 text-left overflow-hidden relative z-10 group-hover:border-blue-50 transition-colors">
                       {selectedParticipant.photo ? <img src={selectedParticipant.photo} className="w-full h-full object-cover shrink-0" /> : <User size={48} className="sm:w-[80px] sm:h-[80px] text-slate-300 shrink-0" />}
                    </div>
                    <label className="absolute -bottom-1 -right-1 sm:-bottom-0 sm:right-2 p-2.5 sm:p-3.5 bg-blue-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-slate-900 hover:scale-110 transition-all flex items-center justify-center border-2 sm:border-4 border-slate-50 z-20 shrink-0">
                       <Camera size={14} className="sm:w-5 sm:h-5 shrink-0" />
                       <input type="file" accept="image/*" onChange={handlePhotoUploadInstant} className="hidden" />
                    </label>
                 </div>

                 <h3 className="text-lg sm:text-2xl font-black text-slate-800 text-center uppercase tracking-tighter leading-tight mb-2 sm:mb-3 font-sans truncate w-full">{selectedParticipant.nama}</h3>
                 <div className="bg-slate-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-[8px] sm:text-[10px] font-black tracking-widest flex items-center gap-2 mb-6 sm:mb-12 shadow-lg leading-none uppercase shrink-0 max-w-full">
                    <span className="truncate">NIK: {selectedParticipant.nik || '-'}</span>
                 </div>
                 
                 {/* Form Edit Status Langsung */}
                 <div className="w-full bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 shadow-sm space-y-4 sm:space-y-6 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    <div className="flex flex-col gap-2 sm:gap-2.5 w-full">
                       <label className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 block"><Edit3 size={10} className="sm:w-3 sm:h-3 text-blue-500 shrink-0"/> Status Siswa</label>
                       <select 
                          value={selectedParticipant.status} 
                          onChange={(e) => handleInstantUpdate('status', e.target.value)}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl outline-none font-black text-xs sm:text-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer min-h-[40px]"
                       >
                          <option value="Aktif">Aktif Belajar</option>
                          <option value="Non-Aktif">Tidak Aktif / Berhenti</option>
                          <option value="Lulus">Lulus</option>
                       </select>
                    </div>
                    <div className="flex flex-col gap-2 sm:gap-2.5 w-full">
                       <label className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 block"><Calendar size={10} className="sm:w-3 sm:h-3 text-blue-500 shrink-0"/> Tgl. Berakhir</label>
                       <input 
                          type="date" 
                          value={selectedParticipant.tanggalSelesaiBelajar || selectedParticipant.tanggalKeluar || ''} 
                          onChange={(e) => handleInstantUpdate('tanggalSelesaiBelajar', e.target.value)}
                          className="appearance-none w-full px-3 sm:px-4 py-2.5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl outline-none font-bold text-xs sm:text-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer min-h-[40px]"
                       />
                    </div>
                 </div>

                 <button onClick={() => setIsDetailModalOpen(false)} className="mt-6 sm:mt-10 text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors flex items-center gap-2 md:hidden bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm shrink-0"><X size={14} className="shrink-0" /> Tutup Profil</button>
              </div>

              {/* KOLOM KANAN: INFO AKADEMIK & NILAI */}
              <div className="flex-grow p-5 sm:p-12 lg:p-16 overflow-y-auto bg-white flex flex-col leading-normal text-left text-black font-sans leading-none text-left w-full min-w-0">
                 
                 {/* Kontak Info */}
                 <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-6 sm:mb-10 w-full min-w-0">
                     <a href={`https://wa.me/${selectedParticipant.telepon && selectedParticipant.telepon.startsWith('0') ? '62' + selectedParticipant.telepon.slice(1) : selectedParticipant.telepon}`} target="_blank" rel="noopener noreferrer" className="w-full sm:flex-1 flex items-center gap-3 sm:gap-4 p-3 sm:p-5 bg-emerald-50 rounded-xl sm:rounded-[1.5rem] border border-emerald-100 hover:bg-emerald-100 hover:shadow-md transition-all cursor-pointer group min-w-0">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform shadow-sm"><Phone size={14} className="sm:w-[18px] sm:h-[18px] shrink-0" /></div>
                        <div className="flex flex-col overflow-hidden min-w-0 flex-1"><span className="text-[7px] sm:text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1 sm:mb-1.5 truncate w-full">WhatsApp Aktif</span><span className="font-bold text-emerald-950 text-xs sm:text-sm truncate w-full">{selectedParticipant.telepon || '-'}</span></div>
                     </a>
                     <div className="w-full sm:flex-1 flex items-center gap-3 sm:gap-4 p-3 sm:p-5 bg-blue-50 rounded-xl sm:rounded-[1.5rem] border border-blue-100 hover:bg-blue-100 hover:shadow-md transition-all min-w-0">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"><Mail size={14} className="sm:w-[18px] sm:h-[18px] shrink-0" /></div>
                        <div className="flex flex-col overflow-hidden min-w-0 flex-1"><span className="text-[7px] sm:text-[9px] font-black text-blue-700 uppercase tracking-widest mb-1 sm:mb-1.5 truncate w-full">Alamat Email</span><span className="font-bold text-blue-950 text-xs sm:text-sm truncate w-full">{selectedParticipant.email || '-'}</span></div>
                     </div>
                 </div>

                 <div className="flex flex-col xl:flex-row xl:justify-between items-start gap-4 sm:gap-6 xl:gap-0 mb-8 sm:mb-14 shrink-0 leading-none text-black text-left text-left w-full min-w-0">
                    <div className="text-left leading-none text-left min-w-0 w-full xl:w-auto flex-1">
                       <p className="text-[8px] sm:text-[12px] font-black text-blue-600 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-2 sm:mb-3 font-sans truncate">Program Terdaftar</p>
                       <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-tight font-sans truncate w-full">
                          {selectedParticipant.program?.split(' (')[0]}
                          <span className="block text-sm sm:text-2xl lg:text-3xl text-slate-400 mt-1 sm:mt-2 tracking-tight font-bold truncate w-full">
                             {selectedParticipant.program?.includes(' (') ? `(${selectedParticipant.program.split(' (')[1]}` : ''}
                          </span>
                       </h2>
                    </div>
                    <div className="bg-slate-50 p-3 sm:p-6 rounded-xl sm:rounded-[2rem] border border-slate-200 flex items-center gap-2 sm:gap-4 shrink-0 shadow-sm leading-none xl:self-start w-full xl:w-auto"><FolderArchive size={16} className="sm:w-8 sm:h-8 text-slate-400 shrink-0"/><span className="text-[8px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none truncate flex-1">Register ID #{selectedParticipant.id.toString().slice(-5)}</span></div>
                 </div>

                 {/* Tampilan Nilai Rata-rata */}
                 <div className="bg-slate-900 rounded-[1.5rem] sm:rounded-[3rem] p-6 sm:p-12 lg:p-14 text-white shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12 shrink-0 leading-none gap-6 sm:gap-0 border border-slate-800 w-full min-w-0">
                    <div className="absolute right-0 top-0 w-32 sm:w-64 h-full bg-blue-500/20 skew-x-[-20deg] translate-x-16 sm:translate-x-32 leading-none text-white text-left blur-2xl"></div>
                    <div className="leading-none z-10 min-w-0">
                        <p className="text-[8px] sm:text-[12px] font-black uppercase tracking-[0.2em] sm:tracking-[0.5em] text-blue-400 mb-3 sm:mb-8 flex items-center gap-2 sm:gap-3 font-sans truncate"><Award size={14} className="sm:w-5 sm:h-5 text-blue-400 shrink-0"/> Indeks Skor (GPA)</p>
                        <div className="flex items-baseline leading-none text-white">
                            <span className="text-5xl sm:text-8xl lg:text-9xl font-black tracking-tighter text-white drop-shadow-lg shrink-0">{hitungRataRata(selectedParticipant.nilai)}</span>
                            <span className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-600 ml-2 sm:ml-5 tracking-widest shrink-0">/100</span>
                        </div>
                    </div>
                 </div>
                 
                 <div className="hidden md:flex justify-end mt-auto pt-6 shrink-0">
                    <button onClick={() => setIsDetailModalOpen(false)} className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-slate-900 border border-slate-200 transition-colors flex items-center gap-2 sm:gap-3 bg-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-sm shrink-0"><X size={16} className="shrink-0" /> Tutup Jendela Profil</button>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- AREA OUTPUT TRANSKRIP PDF --- */}
      {selectedParticipant && (
        <div className="hidden print:block bg-white text-black p-0 min-h-screen fixed inset-0 z-[9999] leading-none text-black text-left">
          <div className="mx-auto w-[14.8cm] min-h-[21cm] pt-8 px-8 pb-8 bg-white border-[10px] border-double border-slate-200 shadow-none flex flex-col relative text-black text-left">
             <div className="absolute top-4 left-4 opacity-5 italic text-7xl font-black text-black">e</div>
             <div className="absolute bottom-4 right-4 opacity-5 italic text-7xl font-black text-black">e</div>
             
             {/* Foto Siswa (Opsional jika mengganggu ruang, bisa dipertahankan dgn ukuran kecil) */}
             {selectedParticipant.photo && (
                <div className="absolute top-28 right-8 w-[2.5cm] h-[3.5cm] border-2 border-black p-1 shadow-sm leading-none bg-white z-20">
                   <img src={selectedParticipant.photo} className="w-full h-full object-cover" />
                </div>
             )}

             {/* Header Kop Surat */}
             <div className="flex items-center gap-6 border-b-[3px] border-black pb-4 mb-6 leading-none text-black text-left">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center border-2 border-slate-100 shadow-md flex-shrink-0 leading-none overflow-hidden">
                  {LOGO_UTAMA ? (
                    <>
                      <img 
                        src={LOGO_UTAMA} 
                        alt="Logo" 
                        className="w-full h-full object-contain p-1.5 bg-white"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'inline';
                        }}
                      />
                      <span className="text-white font-black text-3xl italic hidden">e</span>
                    </>
                  ) : (
                    <span className="text-white font-black text-3xl italic">e</span>
                  )}
                </div>
                <div className="text-left flex-grow leading-tight text-black text-left">
                   <h1 className="text-2xl font-black uppercase mb-1 text-black text-left tracking-tighter">SHORTCOURSE ENTER</h1>
                   <p className="text-[10px] font-bold uppercase mb-1 text-blue-600 text-left tracking-widest">Training & Certification Center</p>
                </div>
             </div>

             {/* Judul Form */}
             <div className="text-center mb-6 text-center">
                <h2 className="text-xl font-black uppercase underline underline-offset-4 decoration-2 mb-2 text-black text-center leading-none">{selectedParticipant.program?.split(' (')[0] || 'OFFICIAL TRANSCRIPT'}</h2>
                <h3 className="text-[10px] font-bold uppercase text-slate-700 text-center leading-none">{selectedParticipant.program?.includes(' (') ? selectedParticipant.program.split(' (')[1].replace(')', '') : ''}</h3>
             </div>

             {/* Info Detail Peserta */}
             <table className="w-full mb-6 text-[10px] font-bold uppercase leading-relaxed text-black z-10 relative">
                <tbody>
                    <tr>
                        <td className="w-[120px] py-1 align-top">NAMA PESERTA</td>
                        <td className="w-[10px] text-center align-top">:</td>
                        <td className="align-top font-black text-slate-900 pl-2">{selectedParticipant.nama}</td>
                    </tr>
                    <tr>
                        <td className="py-1 align-top">TANGGAL MASUK</td>
                        <td className="text-center align-top">:</td>
                        <td className="align-top font-black text-slate-900 pl-2">{selectedParticipant.tanggalMulaiBelajar || '-'}</td>
                    </tr>
                    <tr>
                        <td className="py-1 align-top">PROGRAM</td>
                        <td className="text-center align-top">:</td>
                        <td className="align-top font-black text-slate-900 pl-2">{selectedParticipant.program?.split(' (')[0]}</td>
                    </tr>
                    <tr>
                        <td className="py-1 align-top">JUMLAH PERTEMUAN</td>
                        <td className="text-center align-top">:</td>
                        <td className="align-top font-black text-slate-900 pl-2">{selectedParticipant.program?.includes(' (') ? selectedParticipant.program.split(' (')[1].replace(')', '') : '-'}</td>
                    </tr>
                    <tr>
                        <td className="py-1 align-top">TANGGAL SELESAI</td>
                        <td className="text-center align-top">:</td>
                        <td className="align-top font-black text-slate-900 pl-2">{selectedParticipant.tanggalSelesaiBelajar || selectedParticipant.tanggalKeluar || '-'}</td>
                    </tr>
                </tbody>
             </table>

             {/* Tabel Penilaian */}
             <div className="flex-grow mb-6 leading-none text-black z-10 relative">
                <table className="w-full border-collapse border-2 border-black text-xs leading-none text-black font-sans text-left">
                  <thead>
                    <tr className="bg-slate-100 text-black leading-none text-black">
                      <th className="border-2 border-black p-2 w-10 text-center font-black leading-none">No</th>
                      <th className="border-2 border-black p-2 text-left uppercase font-black leading-none pl-4">Materi Pembelajaran</th>
                      <th className="border-2 border-black p-2 w-24 text-center font-black leading-none">Skor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedParticipant.nilai && selectedParticipant.nilai.length > 0 ? selectedParticipant.nilai.map((n, i) => (
                        <tr key={i} className="text-black leading-none text-left">
                          <td className="border-2 border-black p-2 text-center font-bold text-sm leading-none">{i + 1}</td>
                          <td className="border-2 border-black p-2 uppercase font-black text-[11px] text-left leading-none pl-4">{n.materi}</td>
                          <td className="border-2 border-black p-2 text-center font-black text-base bg-slate-50/30 leading-none">{n.skor}</td>
                        </tr>
                      )) : <tr><td colSpan="3" className="p-6 text-center leading-none text-xs">Data Belum Ada</td></tr>
                    }
                  </tbody>
                  {selectedParticipant.nilai && selectedParticipant.nilai.length > 0 && (
                    <tfoot className="font-black bg-slate-900 text-white text-white">
                      <tr className="text-white">
                        <td colSpan="2" className="border-2 border-black p-2 pr-4 text-right uppercase text-[10px] text-white">Rata-Rata Nilai (GPA)</td>
                        <td className="border-2 border-black p-2 text-center text-lg bg-blue-700 text-white leading-none">{hitungRataRata(selectedParticipant.nilai)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
             </div>

             {/* Footer Tanggal & Tanda Tangan */}
             <div className="flex justify-between items-end mt-auto text-black font-sans text-left leading-none z-10 relative">
                {/* Grading Policy Kiri Bawah */}
                <div className="w-[140px] border-l-2 border-black pl-3 text-left leading-none pb-2">
                   <p className="font-black text-[8px] uppercase mb-2 text-black underline leading-none">Grading Policy:</p>
                   <table className="text-[7px] font-bold uppercase text-slate-700 leading-none text-left">
                      <tbody>
                        <tr><td className="pr-3 pb-1">86 - 100</td><td className="pb-1">: Excellent (A)</td></tr>
                        <tr><td className="pr-3 pb-1">76 - 85</td><td className="pb-1">: Good (B)</td></tr>
                        <tr><td className="pr-3 pb-1">50 - 75</td><td className="pb-1">: Average (C)</td></tr>
                      </tbody>
                   </table>
                </div>
                
                {/* Area Tanda Tangan (Hanya Kanan) */}
                <div className="flex justify-end w-[150px]">
                    <div className="text-center w-full leading-none text-black flex flex-col items-center justify-end">
                       <p className="mb-1 text-[8px] font-bold text-black text-center h-3">Pangkalan Bun, {new Date().toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}</p>
                       <p className="mb-14 text-[9px] font-bold uppercase text-black text-center flex items-end">Instruktur / Pengajar</p>
                       <div className="w-full border-b border-black border-dashed"></div>
                       <p className="mt-1 text-[8px] font-black uppercase">{selectedParticipant.pengajarPrivate || '.............................'}</p>
                    </div>
                </div>
             </div>

          </div>
        </div>
      )}

      {/* --- CSS OVERRIDES FOR PRINT & ANIMATION --- */}
      <style>{`
        @media print {
          @page { size: A5 portrait; margin: 0; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; color: black !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hidden { display: none !important; }
          .hidden.print\\:block { display: block !important; }
        }

        /* CSS Untuk Running Text Alamat */
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-flex;
          padding-left: 100%;
          animation: marquee 40s linear infinite;
        }
        .marquee-container:hover .animate-marquee {
          animation-play-state: paused;
        }
        .fade-edges {
          -webkit-mask-image: linear-gradient(to right, transparent, black 15px, black calc(100% - 15px), transparent);
          mask-image: linear-gradient(to right, transparent, black 15px, black calc(100% - 15px), transparent);
        }
        
        /* Utility untuk menyembunyikan scrollbar di elemen tertentu */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </>
  );
}