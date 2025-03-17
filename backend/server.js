const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { spawn } = require("child_process");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
    }
});

// Store running processes
let runningProcesses = {};

io.on("connection", (socket) => {
    console.log("Client connected");

    // Start Process
    socket.on("start-process", () => {
        const process = spawn("ping", ["127.0.0.1"]);
        const pid = process.pid;
        runningProcesses[pid] = process;

        console.log(`Process Started: ${pid}`);
        socket.emit("process-started", { pid });

        process.on("exit", (code, signal) => {
            console.log(`Process Terminated: ${pid}`);
            delete runningProcesses[pid];
            io.emit("process-terminated", `Process ${pid} Terminated (Code: ${code}, Signal: ${signal})`);
        });
    });

    // Terminate Process
    socket.on("terminate-process", (pid) => {
        if (runningProcesses[pid]) {
            runningProcesses[pid].kill();
            console.log(`Termination signal sent to process ${pid}`);
        } else {
            console.log(`No running process with PID: ${pid}`);
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

server.listen(5000, () => {
    console.log("Server is running on port 5000");
});
