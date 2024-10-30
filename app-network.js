import React, { useState, useEffect } from 'react';
import { CSVLink } from 'react-csv';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Chart from 'chart.js/auto';
import ReactTable from 'react-table';
import 'react-table/react-table.css';

function App() {
  const [student, setStudent] = useState({ id: '', name: '', school: '' });
  const [queryId, setQueryId] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [verifiedStudents, setVerifiedStudents] = useState([]);
  const [authToken, setAuthToken] = useState('');
  const [role, setRole] = useState('');
  const [analyticsData, setAnalyticsData] = useState({});
  
  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket('ws://backend:8000/ws'); // Gunakan 'backend' sebagai nama host
    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      setAuditLog((prevLog) => [...prevLog, data]);
      toast(`New Transaction: ${data.Action} for student ID: ${data.StudentID}`);
    };
    return () => ws.close();
  }, []);

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  // Fungsi untuk autentikasi login
  const handleLogin = async (credentials) => {
    const response = await fetch('http://backend:8000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (data.token) {
      setAuthToken(data.token);
      setRole(data.role);
    } else {
      alert('Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const response = await fetch('http://backend:8000/api/register-student', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${authToken}`,
      },
      body: new URLSearchParams(student),
    });
    if (response.ok) {
      toast('Student registered successfully');
    }
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    const response = await fetch(`http://backend:8000/api/query-student/${queryId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    const result = await response.json();
    setQueryResult(result);
  };

  const handleVerify = async (status) => {
    const response = await fetch(`http://backend:8000/api/verify-students?status=${status}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    const result = await response.json();
    setVerifiedStudents(result);
  };

  // Ambil data statistik untuk analitik siswa
  const fetchAnalytics = async () => {
    const response = await fetch('http://backend:8000/api/analytics', {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    const data = await response.json();
    setAnalyticsData(data);
  };

  useEffect(() => {
    if (authToken) {
      fetchAnalytics();
    }
  }, [authToken]);

  // Fungsi untuk menghasilkan laporan CSV
  const csvData = verifiedStudents.map(student => ({
    ID: student.id,
    Name: student.name,
    School: student.school,
    Status: student.status,
  }));

  return (
    <div className="App">
      <ToastContainer />

      <h1>Register Student</h1>
      <form onSubmit={handleRegister}>
        <input name="id" value={student.id} onChange={handleChange} placeholder="ID" required />
        <input name="name" value={student.name} onChange={handleChange} placeholder="Name" required />
        <input name="school" value={student.school} onChange={handleChange} placeholder="School" required />
        <button type="submit">Register</button>
      </form>

      <h1>Query Student</h1>
      <form onSubmit={handleQuery}>
        <input value={queryId} onChange={(e) => setQueryId(e.target.value)} placeholder="Student ID" required />
        <button type="submit">Query</button>
      </form>

      {queryResult && (
        <div>
          <h2>Query Result:</h2>
          <p>Name: {queryResult.name}</p>
          <p>School: {queryResult.school}</p>
          <p>Status: {queryResult.status}</p>
          <a href={`http://explorer-url/${queryResult.txId}`} target="_blank">View on Blockchain Explorer</a>
        </div>
      )}

      <h1>Audit Log</h1>
      <ReactTable
        data={auditLog}
        columns={[
          { Header: 'Action', accessor: 'Action' },
          { Header: 'Student ID', accessor: 'StudentID' },
          { Header: 'Timestamp', accessor: 'Timestamp' },
        ]}
      />

      <h1>Verify Students</h1>
      <button onClick={() => handleVerify('Registered')}>Verify Registered Students</button>
      <CSVLink data={csvData} filename={"students-report.csv"}>Download CSV Report</CSVLink>
      <ul>
        {verifiedStudents.map((student, index) => (
          <li key={index}>{student.name} - {student.school} - {student.status}</li>
        ))}
      </ul>

      <h1>Student Analytics</h1>
      <div>
        {/* Chart.js atau Recharts untuk grafik */}
        <canvas id="analyticsChart"></canvas>
      </div>
    </div>
  );
}

export default App;
