import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const socket = io("http://localhost:5000", {
    transports: ["websocket", "polling"],
    withCredentials: true
});

export default function App() {
    const [logs, setLogs] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [terminatedProcesses, setTerminatedProcesses] = useState([]);

    useEffect(() => {
        socket.on("process-started", (data) => {
            setProcesses((prev) => [...prev, { pid: data.pid, status: "Running" }]);
        });

        socket.on("process-terminated", (message) => {
            setLogs((prev) => [...prev, message]);
            setProcesses((prev) => prev.filter(p => p.pid !== parseInt(message.split(" ")[1])));
            setTerminatedProcesses((prev) => [...prev, { time: new Date().toLocaleTimeString(), count: prev.length + 1 }]);
        });

        return () => {
            socket.off("process-started");
            socket.off("process-terminated");
        };
    }, []);

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>🚀 Live Process Monitor</h2>
            <button style={styles.startButton} onClick={() => socket.emit("start-process")}>
                Start Process
            </button>

            {/* Process Table */}
            <div style={styles.section}>
                <h3 style={styles.subtitle}>🟢 Running Processes</h3>
                {processes.length === 0 ? (
                    <p style={styles.infoText}>No active processes</p>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th>PID</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processes.map((proc) => (
                                <tr key={proc.pid}>
                                    <td>{proc.pid}</td>
                                    <td>{proc.status}</td>
                                    <td>
                                        <button
                                            style={styles.terminateButton}
                                            onClick={() => socket.emit("terminate-process", proc.pid)}
                                        >
                                            Terminate
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Data Visualization */}
            <div style={styles.chartContainer}>
                <div style={styles.chartBox}>
                    <h3 style={styles.subtitle}>📊 Active Processes</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={processes.map(p => ({ pid: p.pid, count: 1 }))}>
                            <XAxis dataKey="pid" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#4CAF50" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div style={styles.chartBox}>
                    <h3 style={styles.subtitle}>📉 Terminated Processes Over Time</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={terminatedProcesses}>
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#ff4d4d" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Logs Section */}
            <div style={styles.section}>
                <h3 style={styles.subtitle}>📜 Termination Logs</h3>
                <ul style={styles.logList}>
                    {logs.length === 0 ? (
                        <p style={styles.infoText}>No logs yet</p>
                    ) : (
                        logs.map((log, index) => <li key={index} style={styles.logItem}>{log}</li>)
                    )}
                </ul>
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: "20px",
        background: "linear-gradient(135deg, #1e3c72, #2a5298)",
        minHeight: "100vh",
        color: "white",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
    },
    title: {
        fontSize: "28px",
        fontWeight: "bold",
    },
    startButton: {
        background: "#4CAF50",
        color: "white",
        border: "none",
        padding: "12px 20px",
        fontSize: "16px",
        cursor: "pointer",
        borderRadius: "8px",
        margin: "10px 0",
    },
    section: {
        marginTop: "20px",
        padding: "15px",
        background: "rgba(255, 255, 255, 0.2)",
        borderRadius: "8px",
    },
    subtitle: {
        fontSize: "22px",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "10px",
    },
    terminateButton: {
        background: "#ff4d4d",
        color: "white",
        border: "none",
        padding: "8px 12px",
        fontSize: "14px",
        cursor: "pointer",
        borderRadius: "6px",
    },
    chartContainer: {
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        marginTop: "20px",
    },
    chartBox: {
        width: "45%",
        padding: "10px",
        background: "rgba(255, 255, 255, 0.2)",
        borderRadius: "8px",
    },
    logList: {
        listStyle: "none",
        padding: "0",
    },
    logItem: {
        background: "#ffffff33",
        padding: "10px",
        margin: "5px",
        borderRadius: "6px",
    },
    infoText: {
        fontSize: "16px",
        fontStyle: "italic",
    },
};

