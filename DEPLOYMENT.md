# Deployment Guide

This guide covers multiple deployment options for the AI-Powered Interactive Coding Book application.

## 🚀 Quick Deployment Options

### 1. Vercel (Recommended for beginners)
### 2. Docker (Recommended for production)
### 3. Traditional VPS/Cloud Server
### 4. Railway
### 5. Netlify

---

## 🌐 Vercel Deployment

Vercel is the easiest way to deploy Next.js applications.

### Prerequisites
- Vercel account
- GitHub repository
- Gemini API key

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/ai-coding-book.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables:
     - `GEMINI_API_KEY`: Your Google Gemini API key
     - `NODE_ENV`: production

3. **Domain Setup** (Optional)
   - Add custom domain in Vercel dashboard
   - Update `NEXT_PUBLIC_APP_URL` environment variable

### Vercel Configuration

The included `vercel.json` file configures:
- Function timeouts
- Environment variables
- Security headers
- CORS settings

---

## 🐳 Docker Deployment

Docker provides consistent deployment across any environment.

### Prerequisites
- Docker and Docker Compose installed
- Gemini API key

### Local Docker Setup

1. **Build and Run**
   ```bash
   # Copy environment file
   cp .env.example .env.local
   # Add your GEMINI_API_KEY to .env.local
   
   # Build and start
   docker-compose up --build -d
   ```

2. **Access Application**
   - Application: http://localhost:3000
   - Health Check: http://localhost:3000/health
   - Metrics: http://localhost:3000/metrics

### Production Docker Deployment

1. **Prepare Environment**
   ```bash
   # Create production environment file
   cat > .env.production << EOF
   NODE_ENV=production
   GEMINI_API_KEY=your_actual_api_key_here
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   DATABASE_URL=/app/src/data/questions.db
   EOF
   ```

2. **Deploy with Docker Compose**
   ```bash
   # Use production environment
   docker-compose --env-file .env.production up -d
   ```

3. **With SSL/HTTPS**
   ```bash
   # Generate SSL certificates (Let's Encrypt example)
   mkdir ssl
   # Add your SSL certificates to ./ssl/
   
   # Update nginx.conf to enable HTTPS
   # Uncomment HTTPS server block in nginx.conf
   
   docker-compose up -d
   ```

### Docker Commands Reference

```bash
# Build image
docker build -t ai-coding-book .

# Run container
docker run -d -p 3000:3000 --env-file .env.local ai-coding-book

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Update and restart
docker-compose pull && docker-compose up -d
```

---

## 🖥️ Traditional Server Deployment

Deploy on any VPS or cloud server (Ubuntu/CentOS/etc.).

### Prerequisites
- Node.js 18+
- PM2 (process manager)
- Nginx (reverse proxy)
- SSL certificate (optional)

### Setup Steps

1. **Server Preparation**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx -y
   ```

2. **Application Setup**
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/ai-coding-book.git
   cd ai-coding-book
   
   # Install dependencies
   npm install
   
   # Set up environment
   cp .env.example .env.local
   # Edit .env.local with your settings
   
   # Build application
   npm run build
   ```

3. **PM2 Configuration**
   ```bash
   # Create PM2 ecosystem file
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'ai-coding-book',
       script: 'npm',
       args: 'start',
       cwd: '/path/to/your/app',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       },
       instances: 'max',
       exec_mode: 'cluster',
       max_memory_restart: '1G',
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log',
       time: true
     }]
   };
   EOF
   
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

4. **Nginx Configuration**
   ```bash
   # Create Nginx config
   sudo cat > /etc/nginx/sites-available/ai-coding-book << EOF
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade \$http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host \$host;
           proxy_set_header X-Real-IP \$remote_addr;
           proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto \$scheme;
           proxy_cache_bypass \$http_upgrade;
       }
   }
   EOF
   
   # Enable site
   sudo ln -s /etc/nginx/sites-available/ai-coding-book /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **SSL with Let's Encrypt** (Optional)
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx -y
   
   # Get SSL certificate
   sudo certbot --nginx -d your-domain.com
   ```

---

## 🚂 Railway Deployment

Railway offers simple deployment with automatic HTTPS.

### Steps

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**
   ```bash
   railway login
   railway init
   railway add --service postgresql  # Optional database
   railway deploy
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set GEMINI_API_KEY=your_api_key
   railway variables set NODE_ENV=production
   ```

---

## 🌍 Netlify Deployment

Note: Netlify is primarily for static sites, but can work with Next.js using the adapter.

### Steps

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   netlify deploy --prod --dir=.next
   ```

3. **Set Environment Variables**
   - Go to Netlify dashboard
   - Site settings > Environment variables
   - Add `GEMINI_API_KEY`

---

## 📊 Monitoring and Maintenance

### Health Checks

The application includes built-in health check endpoints:

- **Basic Health**: `GET /health` or `GET /api/health`
- **Detailed Metrics**: `GET /metrics` or `GET /api/metrics`

### Monitoring Commands

```bash
# Check application status
curl http://your-domain.com/health

# View detailed metrics
curl http://your-domain.com/metrics

# Check logs (Docker)
docker-compose logs -f ai-coding-book

# Check logs (PM2)
pm2 logs ai-coding-book
```

### Database Backup

```bash
# Backup SQLite database
cp src/data/questions.db backup/questions-$(date +%Y%m%d-%H%M%S).db

# Automated backup script
#!/bin/bash
mkdir -p backups
cp src/data/questions.db backups/questions-$(date +%Y%m%d-%H%M%S).db
# Keep only last 30 backups
ls -t backups/questions-*.db | tail -n +31 | xargs rm -f
```

---

## 🔧 Environment Variables

### Required Variables

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Optional Variables

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
DATABASE_URL=./src/data/questions.db
RATE_LIMIT_REQUESTS=100
```

---

## 🚨 Troubleshooting

### Common Issues

1. **Database Permissions**
   ```bash
   # Ensure database directory is writable
   chmod 755 src/data
   chmod 644 src/data/questions.db
   ```

2. **Memory Issues**
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

3. **Port Already in Use**
   ```bash
   # Find and kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

4. **SSL Certificate Issues**
   ```bash
   # Renew Let's Encrypt certificate
   sudo certbot renew
   sudo systemctl restart nginx
   ```

### Performance Optimization

1. **Enable Caching**
   - Redis for production caching
   - CDN for static assets
   - Database query optimization

2. **Load Balancing**
   - Multiple application instances
   - Nginx load balancing
   - Auto-scaling configuration

---

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load Balancer Setup**
2. **Database Clustering**
3. **Redis Cache Cluster**
4. **CDN Integration**

### Vertical Scaling

1. **Increase server resources**
2. **Optimize database queries**
3. **Enable compression**
4. **Implement caching strategies**

---

## 🔐 Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Rate limiting configured
- [ ] Security headers set
- [ ] Database access restricted
- [ ] API keys rotated regularly
- [ ] Monitoring and logging enabled
- [ ] Backup strategy implemented

---

## 📞 Support

If you encounter issues during deployment:

1. Check the health endpoint: `/health`
2. Review application logs
3. Verify environment variables
4. Check database permissions
5. Ensure all dependencies are installed

For additional support, please refer to the main README.md or create an issue in the repository.