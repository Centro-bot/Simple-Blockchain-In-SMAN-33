// Di dalam App.js
useEffect(() => {
  const ws = new WebSocket('ws://backend:8000/ws'); // Gunakan 'backend' sebagai nama host
  ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    setAuditLog((prevLog) => [...prevLog, data]);
    alert('New Transaction: ' + data.Action + ' for student ID: ' + data.StudentID);
  };
  return () => ws.close();
}, []);

// Saat memanggil API dari React:
const handleRegister = async (e) => {
  e.preventDefault();
  const response = await fetch('http://backend:8000/api/register-student', { // Gunakan 'backend' sebagai URL
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(student),
  });
  if (response.ok) {
    alert('Student registered successfully');
  }
};
