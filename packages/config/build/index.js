"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    db: {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432'),
        user: process.env.PGUSER || 'root',
        password: process.env.PGPASSWORD || 'password',
        database: process.env.UFO_DATABASE || 'norge',
    },
    http: {
        port: parseInt(process.env.HTTP_PORT || '8080'),
    },
};
exports.default = config;
