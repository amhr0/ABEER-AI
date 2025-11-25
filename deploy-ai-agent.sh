#!/bin/bash

# AI Agent System - Complete One-File Deployment
# Upload this file to your server and run: bash deploy-ai-agent.sh

set -e

# Configuration
DOMAIN="abeer.sas-nex.com"
EMAIL="admin@abeer.sas-nex.com"
OPENAI_API_KEY="YOUR_OPENAI_API_KEY_HERE"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                🤖 AI Agent System Deployment               ║"
    echo "║                    Domain: $DOMAIN                     ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[ℹ]${NC} $1"
}

# Main deployment function
deploy_ai_agent() {
    print_header
    
    print_info "Starting deployment on $(hostname) at $(date)"
    echo ""
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        print_error "Please run as regular user (not root)"
        exit 1
    fi
    
    # Step 1: System Update
    print_info "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    print_status "System updated"
    
    # Step 2: Install Dependencies
    print_info "Installing required packages..."
    sudo apt install -y curl wget git nginx software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    print_status "Dependencies installed"
    
    # Step 3: Install Docker
    if ! command -v docker &> /dev/null; then
        print_info "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        print_status "Docker installed"
    else
        print_status "Docker already installed"
    fi
    
    # Step 4: Install Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_info "Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        print_status "Docker Compose installed"
    else
        print_status "Docker Compose already installed"
    fi
    
    # Step 5: Create Project Directory
    print_info "Creating project directory..."
    mkdir -p ~/ai-agent
    cd ~/ai-agent
    print_status "Project directory created"
    
    # Step 6: Create Backend Files
    print_info "Creating backend files..."
    mkdir -p backend
    
    # Backend package.json
    cat > backend/package.json << 'ENDFILE'
{
  "name": "ai-agent-backend",
  "version": "1.0.0",
  "type": "module",
  "description": "AI Agent Backend with OpenAI Integration",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "openai": "^4.20.1",
    "express-rate-limit": "^7.1.5"
  },
  "keywords": ["ai", "agent", "openai", "express"],
  "author": "AI Agent System",
  "license": "MIT"
}
ENDFILE

    # Backend index.js
    cat > backend/index.js << 'ENDFILE'
import express from "express";
import cors from "cors";
import { agent } from "./agent.js";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
dotenv.config();

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const corsOptions = {
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.post("/api/agent", async (req, res) => {
  try {
    const reply = await agent(req.body.message);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
ENDFILE

    # Backend agent.js
    cat > backend/agent.js << 'ENDFILE'
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function agent(msg) {
  const response = await client.chat.completions.create({
    model: "gpt-4.1",
    messages: [{ role: "user", content: msg }]
  });

  return response.choices[0].message.content;
}
ENDFILE

    # Backend .env
    cat > backend/.env << ENDFILE
# Production Environment Configuration
NODE_ENV=production

# OpenAI Configuration
OPENAI_API_KEY=$OPENAI_API_KEY

# Domain Configuration
DOMAIN=$DOMAIN
PORT=5001

# Security Configuration
CORS_ORIGIN=https://$DOMAIN
TRUST_PROXY=true

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined
ENDFILE

    # Backend Dockerfile
    cat > backend/Dockerfile << 'ENDFILE'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 5001
CMD ["node", "index.js"]
ENDFILE

    print_status "Backend files created"
    
    # Step 7: Create Frontend Files
    print_info "Creating frontend files..."
    mkdir -p frontend
    
    # Frontend index.html
    cat > frontend/index.html << 'ENDFILE'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Agent - $DOMAIN</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>🤖 AI Agent System</h1>
            <p>Domain: $DOMAIN</p>
        </header>
        
        <div class="chat-container">
            <div id="chat-messages"></div>
            <div class="input-container">
                <input type="text" id="message-input" placeholder="Type your message..." />
                <button id="send-button">Send</button>
            </div>
        </div>
        
        <div class="status" id="status">
            <span class="status-indicator" id="status-indicator"></span>
            <span id="status-text">Connecting...</span>
        </div>
    </div>
    
    <script src="app.js"></script>
</body>
</html>
ENDFILE

    # Frontend app.js
    cat > frontend/app.js << 'ENDFILE'
class AIAgent {
    constructor() {
        this.apiUrl = '/api/agent';
        this.healthUrl = '/api/health';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkHealth();
        setInterval(() => this.checkHealth(), 30000);
    }

    setupEventListeners() {
        const sendButton = document.getElementById('send-button');
        const messageInput = document.getElementById('message-input');

        sendButton.addEventListener('click', () => this.sendMessage());
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    async checkHealth() {
        try {
            const response = await fetch(this.healthUrl);
            const data = await response.json();
            this.updateStatus('connected', 'Connected to AI Agent');
        } catch (error) {
            this.updateStatus('disconnected', 'Connection failed');
        }
    }

    updateStatus(status, text) {
        const indicator = document.getElementById('status-indicator');
        const textElement = document.getElementById('status-text');
        
        indicator.className = `status-indicator ${status}`;
        textElement.textContent = text;
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (!message) return;

        this.addMessage(message, 'user');
        input.value = '';

        try {
            this.updateStatus('thinking', 'AI is thinking...');
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();
            
            if (data.reply) {
                this.addMessage(data.reply, 'ai');
                this.updateStatus('connected', 'Connected to AI Agent');
            } else if (data.error) {
                this.addMessage(`Error: ${data.error}`, 'error');
                this.updateStatus('error', 'Error occurred');
            }
        } catch (error) {
            this.addMessage('Connection error. Please try again.', 'error');
            this.updateStatus('disconnected', 'Connection failed');
        }
    }

    addMessage(content, sender) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;
        messageElement.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AIAgent();
});
ENDFILE

    # Frontend styles.css
    cat > frontend/styles.css << 'ENDFILE'
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
}

.container {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 800px;
    height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    text-align: center;
}

header h1 {
    font-size: 2rem;
    margin-bottom: 5px;
}

header p {
    opacity: 0.9;
    font-size: 0.9rem;
}

.chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 20px;
}

#chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    margin-bottom: 20px;
    background: #f8f9fa;
    border-radius: 10px;
}

.message {
    margin-bottom: 15px;
    display: flex;
    flex-direction: column;
}

.message.user {
    align-items: flex-end;
}

.message.ai {
    align-items: flex-start;
}

.message.error {
    align-items: center;
    color: #dc3545;
}

.message-content {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 18px;
    margin-bottom: 5px;
}

.message.user .message-content {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.message.ai .message-content {
    background: #e9ecef;
    color: #333;
}

.message.error .message-content {
    background: #f8d7da;
    color: #721c24;
}

.message-time {
    font-size: 0.7rem;
    color: #6c757d;
}

.input-container {
    display: flex;
    gap: 10px;
}

#message-input {
    flex: 1;
    padding: 12px 16px;
    border: 2px solid #e9ecef;
    border-radius: 25px;
    outline: none;
    font-size: 1rem;
    transition: border-color 0.3s ease;
}

#message-input:focus {
    border-color: #667eea;
}

#send-button {
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease;
}

#send-button:hover {
    transform: translateY(-2px);
}

.status {
    padding: 10px 20px;
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;
    display: flex;
    align-items: center;
    gap: 10px;
}

.status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.status-indicator.connected {
    background: #28a745;
    animation: pulse 2s infinite;
}

.status-indicator.disconnected {
    background: #dc3545;
}

.status-indicator.thinking {
    background: #ffc107;
    animation: pulse 1s infinite;
}

.status-indicator.error {
    background: #dc3545;
    animation: blink 1s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

@keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
}

@media (max-width: 768px) {
    .container {
        height: 90vh;
        margin: 10px;
    }
    
    header h1 {
        font-size: 1.5rem;
    }
    
    .message-content {
        max-width: 85%;
    }
    
    #message-input {
        font-size: 0.9rem;
    }
    
    #send-button {
        padding: 10px 20px;
        font-size: 0.9rem;
    }
}
ENDFILE

    print_status "Frontend files created"
    
    # Step 8: Create Docker Compose
    print_info "Creating Docker Compose configuration..."
    
    cat > docker-compose.yml << 'ENDFILE'
version: "3.8"

services:
  backend:
    build: ./backend
    env_file:
      - ./backend/.env
    ports:
      - "5001:5001"
    networks:
      - agent-network
    restart: unless-stopped
    environment:
      - NODE_ENV=production

  frontend:
    image: nginx:alpine
    ports:
      - "3000:80"
    volumes:
      - ./frontend:/usr/share/nginx/html
    networks:
      - agent-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx:/etc/nginx/conf.d
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
    depends_on:
      - backend
      - frontend
    networks:
      - agent-network
    restart: unless-stopped

networks:
  agent-network:
    driver: bridge
ENDFILE

    # Create nginx directory and config
    mkdir -p nginx
    cat > nginx/default.conf << 'ENDFILE'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;

    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /api/ {
        proxy_pass http://backend:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
        
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}
ENDFILE

    # Replace domain placeholder
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/default.conf
    
    print_status "Docker configuration created"
    
    # Step 9: Build and Deploy
    print_info "Building and deploying services..."
    
    # Create deployment script
    cat > deploy.sh << 'ENDFILE'
#!/bin/bash
set -e

echo "🚀 Deploying AI Agent System..."

# Build services
docker-compose build

# Start services
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

# Check status
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
else
    echo "❌ Services failed to start"
    docker-compose logs
    exit 1
fi

echo "🎉 Deployment completed!"
ENDFILE
    
    chmod +x deploy.sh
    
    # Run deployment
    ./deploy.sh
    
    # Step 10: SSL Setup
    print_info "Setting up SSL certificates..."
    
    # Install certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    # Create SSL setup script
    cat > setup-ssl.sh << 'ENDFILE'
#!/bin/bash
set -e

echo "🔐 Setting up SSL certificates..."

# Install certbot if not present
sudo apt install -y certbot python3-certbot-nginx

# Create webroot directory
sudo mkdir -p /var/www/certbot

# Generate certificate
sudo certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    --non-interactive

# Setup auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

echo "✅ SSL setup completed!"
echo "🔒 Your domain is now secured with HTTPS"
ENDFILE
    
    chmod +x setup-ssl.sh
    
    # Final Status
    print_status "✅ AI Agent System deployed successfully!"
    echo ""
    print_info "🌐 Access URLs:"
    echo "   • HTTP:  http://$DOMAIN"
    echo "   • HTTPS: https://$DOMAIN (after SSL setup)"
    echo "   • API:   https://$DOMAIN/api"
    echo "   • Health: https://$DOMAIN/api/health"
    echo ""
    print_info "🔧 Management Commands:"
    echo "   • View logs: docker-compose logs -f"
    echo "   • Stop services: docker-compose down"
    echo "   • Restart services: docker-compose restart"
    echo "   • Setup SSL: ./setup-ssl.sh"
    echo ""
    print_info "📁 Project location: ~/ai-agent"
    print_info "📋 Next steps:"
    echo "   1. Run: ./setup-ssl.sh (for HTTPS)"
    echo "   2. Test the chat interface"
    echo "   3. Monitor logs for any issues"
    
    # Save deployment info
    cat > deployment-info.txt << EOF
AI Agent System - Deployment Completed
=====================================
Date: $(date)
Domain: $DOMAIN
Email: $EMAIL
Location: ~/ai-agent

Access URLs:
- http://$DOMAIN
- https://$DOMAIN (after SSL)
- https://$DOMAIN/api
- https://$DOMAIN/api/health

Commands:
- View logs: docker-compose logs -f
- Stop services: docker-compose down
- Restart services: docker-compose restart
- Setup SSL: ./setup-ssl.sh

Files created:
- backend/          # Node.js backend
- frontend/         # Web interface
- nginx/            # Nginx configuration
- docker-compose.yml # Docker orchestration
- setup-ssl.sh     # SSL certificate setup
EOF

    print_status "Deployment information saved to: deployment-info.txt"
}

# Error handling
trap 'print_error "Deployment failed. Check logs above."' ERR

# Run deployment
deploy_ai_agent

echo ""
print_header
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}🌐 Your AI Agent is ready at: https://$DOMAIN${NC}"
echo ""