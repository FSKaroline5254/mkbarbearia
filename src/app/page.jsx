'use client';
import { useState, useEffect } from 'react';
import {
  getServices, updateService,
  getBusinessHours, updateBusinessHours,
  getAppointments, createAppointment, cancelAppointment as cancelApptDB,
  getSetting, updateSetting,
} from '../lib/supabase';

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function generateTimeSlots(openTime, closeTime, durationMin) {
  const slots = [];
  if (!openTime || !closeTime) return slots;
  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  let current = oh * 60 + om;
  const end = ch * 60 + cm;
  while (current + durationMin <= end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    current += durationMin;
  }
  return slots;
}
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}
function formatDuration(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
function getTodayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function getMinDate() { return getTodayStr(); }
function getMaxDate() { const d = new Date(); d.setDate(d.getDate() + 30); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

const gold = "#C8A35A", darkBg = "#0D0D0D", cardBg = "#161616", cardBg2 = "#1E1E1E",
  textMain = "#F5F0E8", textSub = "#9A9590", danger = "#FF6666", success = "#22C55E";

const S = {
  goldBtn: { background: `linear-gradient(135deg, ${gold}, #A8862F)`, color: "#111", fontWeight: 700, border: "none", borderRadius: 10, padding: "14px 32px", cursor: "pointer", fontSize: 16, letterSpacing: 0.5, boxShadow: "0 4px 16px rgba(200,163,90,0.25)" },
  outlineBtn: { background: "transparent", color: gold, border: `2px solid ${gold}`, borderRadius: 10, padding: "12px 28px", cursor: "pointer", fontSize: 15, fontWeight: 600 },
  card: { background: cardBg, border: "1px solid #252525", borderRadius: 14, padding: 24, marginBottom: 16 },
  input: { background: cardBg2, border: "1px solid #333", borderRadius: 10, padding: "13px 16px", color: textMain, fontSize: 15, width: "100%", boxSizing: "border-box", outline: "none" },
};

function WhatsAppFloat() {
  return (<a href="https://wa.me/5531996453522" target="_blank" rel="noopener noreferrer"
    style={{ position: "fixed", bottom: 24, right: 24, width: 60, height: 60, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(37,211,102,0.4)", zIndex: 1000, textDecoration: "none" }}>
    <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  </a>);
}

function CancelLookup({ appointments, onCancel, onBack }) {
  const [phone, setPhone] = useState(""); const [found, setFound] = useState(null); const [confirmId, setConfirmId] = useState(null);
  function search() {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 8) { setFound([]); return; }
    setFound(appointments.filter(a => a.client_phone.replace(/\D/g, "").includes(cleaned) && a.status !== "cancelado" && a.date >= getTodayStr()).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)));
  }
  return (<div style={{ padding: 20 }}><div style={{ maxWidth: 560, margin: "0 auto" }}>
    <button onClick={onBack} style={{ background: "none", border: "none", color: gold, cursor: "pointer", fontSize: 15, marginBottom: 20, padding: 0 }}>← Voltar</button>
    <h2 style={{ color: gold, marginBottom: 4, fontSize: 24, fontWeight: 800 }}>Cancelar Agendamento</h2>
    <p style={{ color: textSub, marginBottom: 24, fontSize: 15 }}>Digite o telefone usado no agendamento para localizar sua reserva.</p>
    <div style={S.card}><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <input type="tel" placeholder="Seu telefone — (31) 99999-9999" value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} style={{ ...S.input, flex: 1, minWidth: 200 }} />
      <button onClick={search} style={{ ...S.goldBtn, padding: "13px 24px" }}>🔍 Buscar</button>
    </div></div>
    {found !== null && found.length === 0 && <div style={{ ...S.card, textAlign: "center", padding: 32 }}><p style={{ color: textSub }}>Nenhum agendamento encontrado.</p></div>}
    {found && found.length > 0 && found.map(a => (
      <div key={a.id} style={{ ...S.card, borderLeft: `4px solid ${gold}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <span style={{ color: gold, fontWeight: 700, fontSize: 18 }}>{a.date.split("-").reverse().join("/")}</span>
            <span style={{ color: textSub, margin: "0 8px" }}>às</span><span style={{ fontWeight: 700, fontSize: 18 }}>{a.time}</span>
            <div style={{ fontSize: 15, marginTop: 4 }}>{a.services}</div>
            <div style={{ color: textSub, fontSize: 14, marginTop: 4 }}>{a.client_name}</div>
          </div>
          {confirmId === a.id ? (<div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <p style={{ color: danger, fontSize: 13, margin: 0, fontWeight: 600 }}>Tem certeza?</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmId(null)} style={{ background: "#252525", color: textSub, border: "1px solid #333", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13 }}>Não</button>
              <button onClick={() => { onCancel(a.id); setFound(found.filter(x => x.id !== a.id)); setConfirmId(null); }}
                style={{ background: "#3A1515", color: danger, border: "1px solid #5A2020", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Sim, cancelar</button>
            </div>
          </div>) : (
            <button onClick={() => setConfirmId(a.id)} style={{ background: "#2A1515", color: danger, border: "1px solid #3A2020", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Cancelar</button>
          )}
        </div>
      </div>))}
  </div></div>);
}

export default function MKBarbearia() {
  const [page, setPage] = useState("home");
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [hours, setHours] = useState({});
  const [services, setServices] = useState([]);
  const [adminPass, setAdminPass] = useState("");
  const [storedPass, setStoredPass] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [editHours, setEditHours] = useState(null);
  const [editServices, setEditServicesState] = useState(null);
  const [adminTab, setAdminTab] = useState("agenda");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [loginError, setLoginError] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(null);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmNewPass, setConfirmNewPass] = useState("");
  const [passError, setPassError] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);
  useEffect(() => {
    if (lockUntil) { const iv = setInterval(() => { if (Date.now() >= lockUntil) { setLockUntil(null); setLoginAttempts(0); } }, 1000); return () => clearInterval(iv); }
  }, [lockUntil]);

  async function loadData() {
    try {
      const [svcs, hrs, appts, pass] = await Promise.all([
        getServices(), getBusinessHours(), getAppointments(), getSetting('admin_password')
      ]);
      setServices(svcs || []);
      setHours(hrs || {});
      setAppointments(appts || []);
      if (pass) setStoredPass(pass);
    } catch (e) { console.error("Erro ao carregar dados:", e); }
    setLoading(false);
  }

  function showToast(msg) { setToast(msg); }

  function handleLogin() {
    if (lockUntil && Date.now() < lockUntil) return;
    if (adminPass === storedPass) { setIsAdmin(true); setLoginError(false); setLoginAttempts(0); }
    else { setLoginError(true); const n = loginAttempts + 1; setLoginAttempts(n); if (n >= 5) setLockUntil(Date.now() + 60000); }
  }

  async function handleChangePassword() {
    setPassError("");
    if (currentPass !== storedPass) { setPassError("Senha atual incorreta."); return; }
    if (newPass.length < 6) { setPassError("Mínimo 6 caracteres."); return; }
    if (newPass !== confirmNewPass) { setPassError("As senhas não coincidem."); return; }
    if (newPass === storedPass) { setPassError("Deve ser diferente da atual."); return; }
    await updateSetting('admin_password', newPass);
    setStoredPass(newPass);
    setCurrentPass(""); setNewPass(""); setConfirmNewPass("");
    showToast("Senha alterada com sucesso!");
  }

  function toggleService(sv) {
    setSelectedTime("");
    setSelectedServices(prev => prev.find(s => s.id === sv.id) ? prev.filter(s => s.id !== sv.id) : [...prev, sv]);
  }
  function getTotalDuration() { return selectedServices.reduce((s, sv) => s + sv.duration, 0); }
  function getTotalPrice() {
    if (!selectedServices.every(s => s.price && parseFloat(s.price) > 0) || selectedServices.length === 0) return null;
    return selectedServices.reduce((s, sv) => s + parseFloat(sv.price), 0);
  }
  function getAvailableSlots(dateStr) {
    const dur = getTotalDuration();
    if (!dateStr || dur === 0) return [];
    const [y, m, d] = dateStr.split("-").map(Number);
    const dh = hours[new Date(y, m - 1, d).getDay()];
    if (!dh) return [];
    const all = generateTimeSlots(dh.open, dh.close, dur);
    const booked = appointments.filter(a => a.date === dateStr && a.status !== "cancelado").map(a => a.time);
    return all.filter(sl => !booked.includes(sl));
  }

  async function handleBook() {
    if (!clientName || !clientPhone || !selectedTime || selectedServices.length === 0) return;
    const svcNames = selectedServices.map(s => s.name).join(" + ");
    const dur = getTotalDuration(); const price = getTotalPrice();
    try {
      const saved = await createAppointment({ services: svcNames, serviceIds: selectedServices.map(s => s.id), totalDuration: dur, totalPrice: price, date: selectedDate, time: selectedTime, clientName, clientPhone });
      setAppointments([...appointments, saved]);
      setConfirmationData({ ...saved, services: svcNames, totalDuration: dur, totalPrice: price, clientName, clientPhone });
      setPage("confirmed");
    } catch (e) { showToast("Erro ao agendar. Tente novamente."); }
  }

  async function handleCancel(id) {
    try {
      await cancelApptDB(id);
      setAppointments(appointments.map(a => a.id === id ? { ...a, status: "cancelado" } : a));
      showToast("Agendamento cancelado.");
    } catch (e) { showToast("Erro ao cancelar."); }
  }

  async function handleSaveServices() {
    const toSave = editServices || services;
    try {
      for (const sv of toSave) { await updateService(sv.id, { price: sv.price, duration: sv.duration }); }
      setServices(toSave); setEditServicesState(null);
      showToast("Serviços atualizados!");
    } catch (e) { showToast("Erro ao salvar."); }
  }

  async function handleSaveHours() {
    const h = editHours || hours;
    try {
      for (let i = 0; i <= 6; i++) {
        await updateBusinessHours(i, !!h[i], h[i]?.open || "10:00", h[i]?.close || "20:00");
      }
      setHours(h); setEditHours(null);
      showToast("Horários salvos!");
    } catch (e) { showToast("Erro ao salvar."); }
  }

  function resetBooking() { setSelectedServices([]); setSelectedDate(""); setSelectedTime(""); setClientName(""); setClientPhone(""); setConfirmationData(null); }
  function getRemainingLock() { return lockUntil ? Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000)) : 0; }

  const ToastEl = toast ? <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: gold, color: "#111", padding: "12px 28px", borderRadius: 10, fontWeight: 600, fontSize: 15, zIndex: 1001, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>{toast}</div> : null;

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 48, marginBottom: 16 }}>💈</div><p style={{ color: gold, fontSize: 18 }}>Carregando...</p></div></div>;

  // ===== CANCEL =====
  if (page === "cancel") return (<><CancelLookup appointments={appointments} onCancel={handleCancel} onBack={() => setPage("home")} /><WhatsAppFloat />{ToastEl}</>);

  // ===== ADMIN LOGIN =====
  if (page === "admin" && !isAdmin) {
    const isLocked = lockUntil && Date.now() < lockUntil;
    return (<div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
      <div style={{ ...S.card, maxWidth: 420, width: "100%", textAlign: "center", padding: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${gold}11`, border: `2px solid ${gold}33`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>🔒</div>
        <h2 style={{ color: gold, marginBottom: 8, fontSize: 22 }}>Painel Administrativo</h2>
        <p style={{ color: textSub, marginBottom: 24, fontSize: 14 }}>Acesso restrito ao proprietário</p>
        <input type="password" placeholder="Digite sua senha" value={adminPass} onChange={e => { setAdminPass(e.target.value); setLoginError(false); }}
          onKeyDown={e => e.key === "Enter" && !isLocked && handleLogin()} disabled={isLocked}
          style={{ ...S.input, marginBottom: 12, textAlign: "center", fontSize: 16, opacity: isLocked ? 0.5 : 1 }} />
        {loginError && !isLocked && <p style={{ color: danger, fontSize: 13, margin: "0 0 12px" }}>Senha incorreta.</p>}
        {isLocked && <div style={{ background: "#2A1515", border: "1px solid #3A2020", borderRadius: 8, padding: "10px 14px", marginBottom: 12, color: danger, fontSize: 14 }}>🔒 Aguarde {getRemainingLock()}s.</div>}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => { setPage("home"); setAdminPass(""); setLoginError(false); }} style={S.outlineBtn}>Voltar</button>
          <button onClick={handleLogin} disabled={isLocked} style={{ ...S.goldBtn, opacity: isLocked ? 0.5 : 1 }}>Entrar</button>
        </div>
      </div>{ToastEl}
    </div>);
  }

  // ===== ADMIN PANEL =====
  if (page === "admin" && isAdmin) {
    const todayAppts = appointments.filter(a => a.date === getTodayStr() && a.status !== "cancelado");
    const allActive = appointments.filter(a => a.status !== "cancelado" && a.date >= getTodayStr()).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const tabs = [["agenda", "📅 Agenda"], ["servicos", "💈 Serviços"], ["horarios", "🕐 Horários"], ["seguranca", "🔐 Segurança"]];
    const eSvcs = editServices || services;

    return (<div style={{ padding: 20 }}><div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>💈</span>
          <div><h1 style={{ color: gold, fontSize: 22, margin: 0, fontWeight: 800 }}>MKBarbearia</h1><p style={{ color: textSub, fontSize: 13, margin: 0 }}>Painel Administrativo</p></div>
        </div>
        <button onClick={() => { setIsAdmin(false); setAdminPass(""); setPage("home"); setAdminTab("agenda"); setEditServicesState(null); }} style={{ ...S.outlineBtn, padding: "8px 16px", fontSize: 13 }}>Sair</button>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap", background: cardBg, borderRadius: 12, padding: 6 }}>
        {tabs.map(([k, l]) => <button key={k} onClick={() => setAdminTab(k)} style={{ background: adminTab === k ? gold : "transparent", color: adminTab === k ? "#111" : textSub, border: "none", borderRadius: 8, padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: adminTab === k ? 700 : 500, flex: 1 }}>{l}</button>)}
      </div>

      {adminTab === "agenda" && (<div>
        <div style={{ ...S.card, borderLeft: `4px solid ${gold}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: gold, margin: 0, fontSize: 17 }}>Hoje</h3>
            <span style={{ background: `${gold}22`, color: gold, padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{todayAppts.length}</span>
          </div>
          {todayAppts.length === 0 ? <p style={{ color: textSub }}>Nenhum agendamento hoje.</p> :
            todayAppts.map(a => <div key={a.id} style={{ background: cardBg2, borderRadius: 10, padding: 16, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div><span style={{ color: gold, fontWeight: 700, fontSize: 17 }}>{a.time}</span><span style={{ color: textSub, margin: "0 8px" }}>—</span><span>{a.services}</span>
              {a.total_duration && <span style={{ color: textSub, fontSize: 13, marginLeft: 8 }}>({formatDuration(a.total_duration)})</span>}
              <br /><span style={{ color: textSub, fontSize: 14 }}>{a.client_name} • {a.client_phone}</span></div>
              <button onClick={() => handleCancel(a.id)} style={{ background: "#2A1515", color: danger, border: "1px solid #3A2020", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancelar</button>
            </div>)}
        </div>
        <div style={S.card}>
          <h3 style={{ color: gold, margin: "0 0 16px", fontSize: 17 }}>Próximos</h3>
          {allActive.length === 0 ? <p style={{ color: textSub }}>Nenhum agendamento futuro.</p> :
            allActive.map(a => <div key={a.id} style={{ background: cardBg2, borderRadius: 10, padding: 16, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div><span style={{ color: gold, fontWeight: 700 }}>{a.date.split("-").reverse().join("/")}</span> às <span style={{ fontWeight: 600 }}>{a.time}</span>
              <br /><span style={{ fontSize: 14 }}>{a.services}</span><span style={{ color: textSub }}> — {a.client_name} • {a.client_phone}</span></div>
              <button onClick={() => handleCancel(a.id)} style={{ background: "#2A1515", color: danger, border: "1px solid #3A2020", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancelar</button>
            </div>)}
        </div>
      </div>)}

      {adminTab === "servicos" && (<div style={S.card}>
        <h3 style={{ color: gold, margin: "0 0 8px", fontSize: 17 }}>💈 Gerenciar Serviços</h3>
        <p style={{ color: textSub, fontSize: 14, marginBottom: 20 }}>Edite preços e duração. Alterações aparecem automaticamente para clientes.</p>
        {eSvcs.map((sv, idx) => <div key={sv.id} style={{ background: cardBg2, borderRadius: 10, padding: 16, marginBottom: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>{sv.name}</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: gold, fontWeight: 600 }}>R$</span>
              <input type="number" placeholder="0,00" value={sv.price || ""} onChange={e => { const u = [...eSvcs]; u[idx] = { ...u[idx], price: e.target.value }; setEditServicesState(u); }} style={{ ...S.input, width: 100, padding: "8px 12px" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: textSub }}>⏱</span>
              <input type="number" min="5" step="5" value={sv.duration} onChange={e => { const u = [...eSvcs]; u[idx] = { ...u[idx], duration: parseInt(e.target.value) || 15 }; setEditServicesState(u); }} style={{ ...S.input, width: 80, padding: "8px 12px" }} />
              <span style={{ color: textSub, fontSize: 13 }}>min</span>
            </div>
          </div>
        </div>)}
        <button onClick={handleSaveServices} style={{ ...S.goldBtn, marginTop: 16, width: "100%" }}>Salvar</button>
      </div>)}

      {adminTab === "horarios" && (<div style={S.card}>
        <h3 style={{ color: gold, margin: "0 0 8px", fontSize: 17 }}>Horários de Funcionamento</h3>
        <p style={{ color: textSub, fontSize: 14, marginBottom: 20 }}>Alterações aparecem automaticamente para clientes.</p>
        {DAY_NAMES.map((day, i) => { const h = editHours || hours; const dH = h[i];
          return <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap", padding: "10px 0", borderBottom: i < 6 ? "1px solid #1E1E1E" : "none" }}>
            <span style={{ width: 80, fontWeight: 600, fontSize: 15 }}>{day}</span>
            <label style={{ color: textSub, fontSize: 14, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={!!dH} onChange={e => { const u = { ...(editHours || hours) }; u[i] = e.target.checked ? { open: "10:00", close: "20:00" } : null; setEditHours(u); }} style={{ accentColor: gold, width: 18, height: 18 }} />
              {dH ? "Aberto" : "Fechado"}
            </label>
            {dH && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="time" value={dH.open} style={{ ...S.input, width: 120, padding: "8px 12px" }} onChange={e => { const u = { ...(editHours || hours) }; u[i] = { ...u[i], open: e.target.value }; setEditHours(u); }} />
              <span style={{ color: textSub }}>até</span>
              <input type="time" value={dH.close} style={{ ...S.input, width: 120, padding: "8px 12px" }} onChange={e => { const u = { ...(editHours || hours) }; u[i] = { ...u[i], close: e.target.value }; setEditHours(u); }} />
            </div>}
          </div>; })}
        <button onClick={handleSaveHours} style={{ ...S.goldBtn, marginTop: 16 }}>Salvar Horários</button>
      </div>)}

      {adminTab === "seguranca" && (<div style={S.card}>
        <h3 style={{ color: gold, margin: "0 0 8px", fontSize: 17 }}>🔐 Alterar Senha</h3>
        <div style={{ maxWidth: 400 }}>
          <label style={{ color: textSub, fontSize: 13, display: "block", marginBottom: 6 }}>Senha atual</label>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input type={showCurrentPass ? "text" : "password"} placeholder="Senha atual" value={currentPass} onChange={e => { setCurrentPass(e.target.value); setPassError(""); }} style={{ ...S.input, paddingRight: 48 }} />
            <button onClick={() => setShowCurrentPass(!showCurrentPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: textSub, cursor: "pointer" }}>{showCurrentPass ? "🙈" : "👁️"}</button>
          </div>
          <label style={{ color: textSub, fontSize: 13, display: "block", marginBottom: 6 }}>Nova senha</label>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input type={showNewPass ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={newPass} onChange={e => { setNewPass(e.target.value); setPassError(""); }} style={{ ...S.input, paddingRight: 48 }} />
            <button onClick={() => setShowNewPass(!showNewPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: textSub, cursor: "pointer" }}>{showNewPass ? "🙈" : "👁️"}</button>
          </div>
          <label style={{ color: textSub, fontSize: 13, display: "block", marginBottom: 6 }}>Confirmar</label>
          <input type="password" placeholder="Repita" value={confirmNewPass} onChange={e => { setConfirmNewPass(e.target.value); setPassError(""); }} style={{ ...S.input, marginBottom: 12 }} />
          {passError && <p style={{ color: danger, fontSize: 13, marginBottom: 12 }}>{passError}</p>}
          <button onClick={handleChangePassword} disabled={!currentPass || !newPass || !confirmNewPass}
            style={{ ...S.goldBtn, width: "100%", opacity: (!currentPass || !newPass || !confirmNewPass) ? 0.5 : 1 }}>Alterar Senha</button>
        </div>
      </div>)}
    </div>{ToastEl}</div>);
  }

  // ===== CONFIRMATION =====
  if (page === "confirmed" && confirmationData) {
    const cd = confirmationData;
    const whatsMsg = encodeURIComponent(`Olá! Agendei na MKBarbearia:\n📅 ${cd.date.split("-").reverse().join("/")}\n🕐 ${cd.time}\n💈 ${cd.services}\nDuração: ${formatDuration(cd.totalDuration)}${cd.totalPrice ? `\nValor: R$ ${Number(cd.totalPrice).toFixed(2)}` : ""}\nNome: ${cd.clientName}`);
    return (<div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
      <div style={{ ...S.card, maxWidth: 500, width: "100%", textAlign: "center", padding: 36 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #1A3A1A, #0D250D)", border: "2px solid #2A5A2A", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 36 }}>✅</div>
        <h2 style={{ color: gold, marginBottom: 4, fontSize: 24 }}>Agendamento Confirmado!</h2>
        <div style={{ background: cardBg2, borderRadius: 12, padding: 24, textAlign: "left", margin: "20px 0 28px", borderLeft: `4px solid ${gold}` }}>
          <div style={{ marginBottom: 12 }}><span style={{ color: textSub, fontSize: 13 }}>SERVIÇO(S)</span><br /><strong>{cd.services}</strong></div>
          <div style={{ marginBottom: 12 }}><span style={{ color: textSub, fontSize: 13 }}>DURAÇÃO</span><br /><strong>{formatDuration(cd.totalDuration)}</strong></div>
          {cd.totalPrice && <div style={{ marginBottom: 12 }}><span style={{ color: textSub, fontSize: 13 }}>VALOR</span><br /><strong style={{ color: gold }}>R$ {Number(cd.totalPrice).toFixed(2)}</strong></div>}
          <div style={{ marginBottom: 12 }}><span style={{ color: textSub, fontSize: 13 }}>DATA</span><br /><strong>{formatDate(cd.date)}</strong></div>
          <div><span style={{ color: textSub, fontSize: 13 }}>HORÁRIO</span><br /><strong style={{ color: gold }}>{cd.time}</strong></div>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href={`https://wa.me/5531996453522?text=${whatsMsg}`} target="_blank" rel="noopener noreferrer" style={{ ...S.goldBtn, textDecoration: "none" }}>📱 WhatsApp</a>
          <button onClick={() => { resetBooking(); setPage("home"); }} style={S.outlineBtn}>Início</button>
        </div>
      </div><WhatsAppFloat />
    </div>);
  }

  // ===== BOOKING =====
  if (page === "booking") {
    const avail = getAvailableSlots(selectedDate);
    const isClosed = () => { if (!selectedDate) return false; const [y, m, d] = selectedDate.split("-").map(Number); return !hours[new Date(y, m - 1, d).getDay()]; };
    const hasSvc = selectedServices.length > 0; const dur = getTotalDuration(); const price = getTotalPrice();
    const steps = [{ l: "Serviço(s)", d: hasSvc }, { l: "Data", d: !!selectedDate }, { l: "Horário", d: !!selectedTime }, { l: "Dados", d: !!clientName && !!clientPhone }];

    return (<div style={{ padding: 20 }}><div style={{ maxWidth: 620, margin: "0 auto" }}>
      <button onClick={() => { resetBooking(); setPage("home"); }} style={{ background: "none", border: "none", color: gold, cursor: "pointer", fontSize: 15, marginBottom: 20, padding: 0 }}>← Voltar</button>
      <h2 style={{ color: gold, marginBottom: 4, fontSize: 24, fontWeight: 800 }}>Agendar Horário</h2>
      <p style={{ color: textSub, marginBottom: 20 }}>Preencha os dados para reservar seu horário.</p>
      <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
        {steps.map((st, i) => <div key={i} style={{ flex: 1, textAlign: "center" }}><div style={{ height: 4, borderRadius: 2, background: st.d ? gold : "#2A2A2A", marginBottom: 6 }} /><span style={{ fontSize: 11, color: st.d ? gold : textSub, fontWeight: 600 }}>{st.l}</span></div>)}
      </div>

      <div style={S.card}>
        <h3 style={{ color: gold, marginTop: 0, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: gold, color: "#111", width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>1</span>Escolha o(s) Serviço(s)</h3>
        <p style={{ color: textSub, fontSize: 13, margin: "0 0 14px" }}>Selecione um ou mais</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
          {services.map(sv => { const sel = selectedServices.some(s => s.id === sv.id);
            return <button key={sv.id} onClick={() => toggleService(sv)}
              style={{ background: sel ? `${gold}15` : cardBg2, border: sel ? `2px solid ${gold}` : "1px solid #2A2A2A", borderRadius: 10, padding: "16px 14px", cursor: "pointer", color: textMain, textAlign: "center", position: "relative" }}>
              {sel && <div style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%", background: gold, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#111", fontSize: 13, fontWeight: 700 }}>✓</span></div>}
              <div style={{ fontWeight: 600, fontSize: 14 }}>{sv.name}</div>
              <div style={{ color: textSub, fontSize: 12, marginTop: 4 }}>{sv.duration} min</div>
              <div style={{ color: gold, fontSize: 13, marginTop: 4, fontWeight: 600 }}>{sv.price && parseFloat(sv.price) > 0 ? `R$ ${parseFloat(sv.price).toFixed(2)}` : "Consulte"}</div>
            </button>; })}
        </div>
        {hasSvc && <div style={{ marginTop: 16, padding: "14px 16px", background: `${gold}10`, border: `1px solid ${gold}33`, borderRadius: 10, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div><span style={{ color: gold, fontWeight: 600, fontSize: 14 }}>{selectedServices.length} serviço(s)</span><br /><span style={{ color: textSub, fontSize: 13 }}>{selectedServices.map(s => s.name).join(" + ")}</span></div>
          <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700, fontSize: 16 }}>⏱ {formatDuration(dur)}</div>{price !== null && <div style={{ color: gold, fontWeight: 600 }}>R$ {price.toFixed(2)}</div>}</div>
        </div>}
      </div>

      {hasSvc && <div style={S.card}>
        <h3 style={{ color: gold, marginTop: 0, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: gold, color: "#111", width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>2</span>Data</h3>
        <input type="date" min={getMinDate()} max={getMaxDate()} value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSelectedTime(""); }} style={{ ...S.input, maxWidth: 260 }} />
        {isClosed() && <div style={{ background: "#2A1515", border: "1px solid #3A2020", borderRadius: 8, padding: "10px 14px", marginTop: 10, color: danger, fontSize: 14 }}>⚠️ Fechado neste dia.</div>}
      </div>}

      {hasSvc && selectedDate && !isClosed() && <div style={S.card}>
        <h3 style={{ color: gold, marginTop: 0, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: gold, color: "#111", width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>3</span>Horário</h3>
        {avail.length === 0 ? <p style={{ color: danger, fontSize: 14 }}>Sem horários. Tente outra data.</p> :
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{avail.map(sl => <button key={sl} onClick={() => setSelectedTime(sl)}
            style={{ background: selectedTime === sl ? gold : cardBg2, color: selectedTime === sl ? "#111" : textMain, border: selectedTime === sl ? `2px solid ${gold}` : "1px solid #2A2A2A", borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontWeight: 600, fontSize: 15 }}>{sl}</button>)}</div>}
      </div>}

      {selectedTime && <div style={S.card}>
        <h3 style={{ color: gold, marginTop: 0, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: gold, color: "#111", width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>4</span>Seus Dados</h3>
        <input type="text" placeholder="Nome completo" value={clientName} onChange={e => setClientName(e.target.value)} style={{ ...S.input, marginBottom: 12 }} />
        <input type="tel" placeholder="WhatsApp — (31) 99999-9999" value={clientPhone} onChange={e => setClientPhone(e.target.value)} style={S.input} />
      </div>}

      {clientName && clientPhone && selectedTime && <button onClick={handleBook} style={{ ...S.goldBtn, width: "100%", fontSize: 18, padding: 16, marginBottom: 40, borderRadius: 12 }}>✅ Confirmar Agendamento</button>}
    </div><WhatsAppFloat />{ToastEl}</div>);
  }

  // ===== HOME =====
  return (<div>
    <div style={{ textAlign: "center", padding: "56px 20px 44px", background: `linear-gradient(180deg, #1A1611 0%, ${darkBg} 100%)`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${gold}08 0%, transparent 70%)` }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>💈</div>
        <h1 style={{ color: gold, fontSize: 38, fontWeight: 800, letterSpacing: 4, margin: 0, textTransform: "uppercase" }}>MK</h1>
        <h1 style={{ color: textMain, fontSize: 20, fontWeight: 300, letterSpacing: 6, margin: "0 0 4px", textTransform: "uppercase" }}>BARBEARIA</h1>
        <div style={{ width: 60, height: 2, background: `linear-gradient(90deg, transparent, ${gold}, transparent)`, margin: "16px auto" }} />
        <p style={{ color: textSub, fontSize: 16, maxWidth: 420, margin: "0 auto 36px", lineHeight: 1.6 }}>Estilo, precisão e atitude.<br />Agende seu horário e venha cuidar do visual.</p>
        <button onClick={() => setPage("booking")} style={{ ...S.goldBtn, fontSize: 17, padding: "16px 48px", borderRadius: 12 }}>📅 AGENDAR HORÁRIO</button>
      </div>
    </div>

    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px 32px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}><p style={{ color: gold, fontSize: 12, letterSpacing: 3, marginBottom: 4, fontWeight: 600 }}>O QUE OFERECEMOS</p><h2 style={{ fontSize: 24, fontWeight: 700 }}>Nossos Serviços</h2></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))", gap: 12 }}>
        {services.map(sv => <div key={sv.id} onClick={() => { setSelectedServices([sv]); setPage("booking"); }}
          style={{ ...S.card, textAlign: "center", cursor: "pointer", padding: "28px 16px" }}>
          <div style={{ width: 48, height: 3, background: gold, borderRadius: 2, margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 16, margin: "0 0 6px", fontWeight: 600 }}>{sv.name}</h3>
          <p style={{ color: textSub, fontSize: 13, margin: "0 0 10px" }}>{sv.duration} min</p>
          <p style={{ color: gold, fontSize: 15, fontWeight: 600, margin: 0 }}>{sv.price && parseFloat(sv.price) > 0 ? `R$ ${parseFloat(sv.price).toFixed(2)}` : "Consulte via WhatsApp"}</p>
        </div>)}
      </div>
    </div>

    <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 20px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}><p style={{ color: gold, fontSize: 12, letterSpacing: 3, marginBottom: 4, fontWeight: 600 }}>QUANDO ESTAMOS ABERTOS</p><h2 style={{ fontSize: 24, fontWeight: 700 }}>Horários</h2></div>
      <div style={S.card}>
        {DAY_NAMES.map((day, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 4px", borderBottom: i < 6 ? "1px solid #1E1E1E" : "none" }}>
          <span style={{ fontWeight: 600 }}>{day}</span>
          <span style={{ color: hours[i] ? gold : "#FF6666", fontWeight: hours[i] ? 600 : 400 }}>{hours[i] ? `${hours[i].open} — ${hours[i].close}` : "Fechado"}</span>
        </div>)}
      </div>
    </div>

    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 48px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}><p style={{ color: gold, fontSize: 12, letterSpacing: 3, marginBottom: 4, fontWeight: 600 }}>ONDE ESTAMOS</p><h2 style={{ fontSize: 24, fontWeight: 700 }}>Localização & Contato</h2></div>
      <div style={{ ...S.card, textAlign: "center", padding: 32 }}>
        <p style={{ fontSize: 17, marginBottom: 4, fontWeight: 500 }}>📍 Av. Mem de Sá, 1742 — Santa Efigênia</p>
        <p style={{ color: textSub, marginBottom: 24 }}>Belo Horizonte — MG, 30260-270</p>
        <a href="https://wa.me/5531996453522" target="_blank" rel="noopener noreferrer" style={{ ...S.goldBtn, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>📱 WhatsApp: (31) 99645-3522</a>
      </div>
    </div>

    <div style={{ textAlign: "center", padding: "32px 20px 48px", background: `linear-gradient(180deg, ${darkBg} 0%, #1A1611 100%)` }}>
      <h2 style={{ color: gold, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Pronto para renovar o visual?</h2>
      <p style={{ color: textSub, marginBottom: 24 }}>Reserve agora e garanta seu horário.</p>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={() => setPage("booking")} style={{ ...S.goldBtn, fontSize: 17, padding: "16px 48px", borderRadius: 12 }}>AGENDAR AGORA →</button>
        <button onClick={() => setPage("cancel")} style={{ ...S.outlineBtn, padding: "14px 28px", borderRadius: 12 }}>Cancelar agendamento</button>
      </div>
    </div>

    <div style={{ textAlign: "center", padding: 20, borderTop: "1px solid #1A1A1A" }}>
      <button onClick={() => setPage("admin")} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 13 }}>⚙️ Área do Barbeiro</button>
      <p style={{ color: "#333", fontSize: 12, marginTop: 8 }}>© 2026 MKBarbearia</p>
    </div>
    <WhatsAppFloat />{ToastEl}
  </div>);
}
