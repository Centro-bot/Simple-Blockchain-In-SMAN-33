import React, { useState, useEffect } from 'react';

function App() {
  const [student, setStudent] = useState({ id: '', name: '', school: '' });
  const [queryId, setQueryId] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [verifiedStudents, setVerifiedStudents] = useState([]);
  
  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      setAuditLog((prevLog) => [...prevLog, data]);
      alert('New Transaction: ' + data.Action + ' for student ID: ' + data.StudentID);
    };
    return () => ws.close();
  }, []);  

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/register-student', {
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

  const handleQuery = async (e) => {
    e.preventDefault();
    const response = await fetch(`/api/query-student/${queryId}`);
    const result = await response.json();
    setQueryResult(result);
  };

  const handleVerify = async (status) => {
    const response = await fetch(`/api/verify-students?status=${status}`);
    const result = await response.json();
    setVerifiedStudents(result);
  };

  return (
    <div className="App">
      <h1>Register Student</h1>
      <form onSubmit={handleRegister}>
        <input name="id" value={student.id} onChange={handleChange} placeholder="ID" required />
        <input name="name" value={student.name} onChange={handleChange} placeholder="Name" required />
        <input name="school" value={student.school} onChange={handleChange} placeholder="School" required />
        <button type="submit">Register</button>
      </form>

      <h1>Query Student</h1>
      <form onSubmit={handleQuery}>
        <input
          value={queryId}
          onChange={(e) => setQueryId(e.target.value)}
          placeholder="Student ID"
          required
        />
        <button type="submit">Query</button>
      </form>

      {queryResult && (
        <div>
          <h2>Query Result:</h2>
          <p>Name: {queryResult.name}</p>
          <p>School: {queryResult.school}</p>
          <p>Status: {queryResult.status}</p>
        </div>
      )}

      <h1>Audit Log</h1>
      <ul>
        {auditLog.map((log, index) => (
          <li key={index}>{log.Action} - Student ID: {log.StudentID} at {log.Timestamp}</li>
        ))}
      </ul>

      <h1>Verify Students</h1>
      <button onClick={() => handleVerify('Registered')}>Verify Registered Students</button>
      <ul>
        {verifiedStudents.map((student, index) => (
          <li key={index}>{student.Name} - {student.School} - {student.Status}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;