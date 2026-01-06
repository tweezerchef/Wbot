# Hetzner US + k3s Deployment Plan

> **Target:** Deploy Wbot (AI + Web) on a single Hetzner server using k3s
> **Cost:** ~$5.39/month (CX22 in Ashburn, VA)
> **Scale Path:** Single node → Multi-node k3s → Managed K8s
> **Experience Required:** None! This guide explains everything.

---

## Table of Contents

- [Beginner's Guide: Understanding the Technology](#beginners-guide-understanding-the-technology)
- [Glossary of Commands](#glossary-of-commands)
- [Prerequisites](#prerequisites)
- [Phase 0: Local Testing with Docker Compose](#phase-0-local-testing-with-docker-compose)
- [Phase 1: Server Creation](#phase-1-server-creation)
- [Phase 2: Server Setup](#phase-2-server-setup)
- [Phase 3: Deploy Wbot](#phase-3-deploy-wbot)
- [Phase 4: Access Your Application](#phase-4-access-your-application)
- [Phase 5: SSL/TLS Setup](#phase-5-ssltls-setup)
- [Scaling Strategy](#scaling-strategy)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)
- [Quick Reference](#quick-reference-commands)
- [Deployment Checklist](#deployment-checklist)

---

## Beginner's Guide: Understanding the Technology

If you're new to Docker, Kubernetes, and cloud servers, this section explains everything you need to know.

### What Problem Are We Solving?

Your Wbot application has multiple parts:

- **Web Frontend** - The React/TanStack app users see in their browser
- **AI Backend** - The Python/FastAPI server that runs the AI
- **Redis** - A cache database for storing temporary data

Running these locally with `pnpm dev` works great, but to let real users access your app from the internet, you need to deploy it to a server that's always running.

### The Traditional Way (Without Containers)

Imagine deploying the old way:

1. Rent a server
2. SSH in and install Python, Node.js, Redis manually
3. Copy your code files over
4. Start each service manually
5. Hope everything works together
6. Pray nothing breaks when you update

**Problems:**

- "It works on my machine!" - Different environments cause bugs
- Hard to replicate the exact setup
- Updates are scary and manual
- If the server dies, you start from scratch

### The Container Way (Docker)

**Docker** solves this by packaging your application AND its environment together.

```
+-------------------------------------------------------------+
|                    Docker Container                          |
|  +--------------------------------------------------------+ |
|  |  Your Application Code                                  | |
|  |  + Python 3.13 runtime                                  | |
|  |  + All pip dependencies                                 | |
|  |  + Configuration files                                  | |
|  |  + Everything needed to run                             | |
|  +--------------------------------------------------------+ |
|  This EXACT same box runs identically everywhere!           |
+-------------------------------------------------------------+
```

**Think of it like shipping:**

- Without containers: Ship loose items, hope they arrive intact
- With containers: Ship in a sealed container, arrives exactly as packed

### What is Docker? (Detailed)

Docker is a tool that creates and runs **containers**. Here's the vocabulary:

| Term           | What It Is                            | Real-World Analogy                      |
| -------------- | ------------------------------------- | --------------------------------------- |
| **Image**      | A blueprint/recipe for your app       | A frozen meal - everything pre-packaged |
| **Container**  | A running instance of an image        | The meal after you microwave it         |
| **Dockerfile** | Instructions to build an image        | The recipe card                         |
| **Registry**   | Storage for images (Docker Hub, GHCR) | A warehouse of frozen meals             |
| **Build**      | Create an image from Dockerfile       | Cooking and freezing the meal           |
| **Push**       | Upload image to registry              | Shipping to the warehouse               |
| **Pull**       | Download image from registry          | Getting a meal from the warehouse       |

**Your Wbot already has Dockerfiles:**

- `apps/ai/Dockerfile` - Instructions to package the AI backend
- `apps/web/Dockerfile` - Instructions to package the web frontend

### What is Kubernetes? (Detailed)

Now you have containers, but who manages them? That's **Kubernetes** (often written as "K8s" - K, 8 letters, s).

**Kubernetes is an orchestrator** - it manages your containers automatically:

```
Without Kubernetes (Manual):
+-------------------------------------------------------------+
|  You (the human) must:                                      |
|  - Start containers manually                                |
|  - Restart them if they crash                               |
|  - Monitor resource usage                                   |
|  - Scale up when traffic increases                          |
|  - Handle networking between containers                     |
|  - Manage updates without downtime                          |
+-------------------------------------------------------------+

With Kubernetes (Automated):
+-------------------------------------------------------------+
|  Kubernetes handles ALL of that automatically!              |
|                                                             |
|  You just say: "I want 2 copies of my web app running"      |
|  Kubernetes: "Done. I'll keep them healthy forever."        |
+-------------------------------------------------------------+
```

### Kubernetes Vocabulary

| Term           | What It Is                                         | Analogy                             |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| **Cluster**    | A group of servers running Kubernetes              | The entire restaurant               |
| **Node**       | One server in the cluster                          | One kitchen                         |
| **Pod**        | The smallest deployable unit (usually 1 container) | One dish being prepared             |
| **Deployment** | Defines how many pods to run and how               | The recipe + how many to make       |
| **Service**    | A stable network address for pods                  | The serving counter                 |
| **Namespace**  | A way to organize resources                        | Different sections of the menu      |
| **kubectl**    | The command-line tool to control K8s               | The kitchen manager's walkie-talkie |

### What is k3s?

**k3s** is a lightweight version of Kubernetes, perfect for:

- Single servers (like ours)
- Small teams
- Development/testing
- Learning Kubernetes

**k3s vs Full Kubernetes:**

```
Full Kubernetes (k8s):          k3s:
- Needs 2GB+ RAM just to run    - Needs only 512MB RAM
- Complex to install            - One command to install
- Multiple components           - Single binary file
- Production-focused            - Works for everything
- 100% compatible               - 100% compatible ✓
```

They're the same thing, just k3s is simpler. Your manifests work on both!

### What is a VPS / Cloud Server?

A **VPS (Virtual Private Server)** is a computer you rent in someone else's data center:

```
Data Center (Hetzner's building in Virginia):
+-------------------------------------------------------------+
|  Physical Server (Very Powerful)                            |
|  +-----------------+ +-----------------+ +---------------+  |
|  | Your VPS       | | Someone else's  | | Another       |  |
|  | (CX22)         | | VPS             | | customer's    |  |
|  | 2 CPU, 4GB RAM | |                 | | VPS           |  |
|  +-----------------+ +-----------------+ +---------------+  |
|                                                             |
|  Virtualization splits one physical server into many VPSs   |
+-------------------------------------------------------------+
```

**Why Hetzner?**

- Very cheap (~$5/month vs $20+ elsewhere)
- Good performance
- US data centers (low latency for US users)
- No lock-in (easy to move away)

### How All the Pieces Fit Together

```
Your Local Machine                    Hetzner Server (Cloud)
+---------------------+              +-----------------------------+
|                     |              |  Ubuntu Linux (OS)          |
|  Your code          |    Build     |                             |
|  (apps/ai,          | ---------->  |  k3s (Kubernetes)           |
|   apps/web)         |   & Push     |  +-------------------------+|
|                     |   Images     |  | Pod: AI Backend         ||
|  Dockerfile         |              |  | Pod: Web Frontend       ||
|  (instructions)     |              |  | Pod: Redis              ||
|                     |              |  +-------------------------+|
|  kubectl            |   Commands   |                             |
|  (control tool)     | ---------->  |  Your app runs here 24/7!  |
|                     |              |                             |
+---------------------+              +-----------------------------+
         |                                        |
         |      Docker Hub / GHCR                 |
         |      (Image Storage)                   |
         |   +---------------------+              |
         +-->| wbot-ai:latest      |<-------------+
             | wbot-web:latest     |   (Server pulls images)
             +---------------------+
```

### What Happens When You Deploy

1. **Build**: Docker reads your Dockerfile and creates an image (a snapshot of your app + everything it needs)

2. **Push**: The image is uploaded to Docker Hub or GitHub Container Registry (like uploading to Dropbox)

3. **Apply**: You tell Kubernetes "run this" using kubectl and YAML files (manifests)

4. **Pull**: Kubernetes downloads your images from the registry

5. **Run**: Kubernetes starts your containers, monitors them, restarts if they crash

6. **Serve**: Users can access your app via the internet!

---

## Glossary of Commands

Before we start, here's what the commands mean:

### Terminal Commands

| Command  | What It Does                 | Example                         |
| -------- | ---------------------------- | ------------------------------- |
| `ssh`    | Connect to a remote server   | `ssh root@1.2.3.4`              |
| `apt`    | Install software on Ubuntu   | `apt install curl`              |
| `curl`   | Download files from internet | `curl https://example.com/file` |
| `cat`    | Display file contents        | `cat /etc/hosts`                |
| `nano`   | Simple text editor           | `nano myfile.txt`               |
| `export` | Set environment variable     | `export MY_VAR=value`           |

### Docker Commands

| Command        | What It Does                 | Example                       |
| -------------- | ---------------------------- | ----------------------------- |
| `docker build` | Create image from Dockerfile | `docker build -t myapp:v1 .`  |
| `docker push`  | Upload image to registry     | `docker push myuser/myapp:v1` |
| `docker pull`  | Download image               | `docker pull nginx:latest`    |
| `docker login` | Authenticate with registry   | `docker login`                |

### Kubernetes (kubectl) Commands

| Command                | What It Does             | Example                                  |
| ---------------------- | ------------------------ | ---------------------------------------- |
| `kubectl get`          | List resources           | `kubectl get pods`                       |
| `kubectl apply`        | Create/update resources  | `kubectl apply -f myfile.yaml`           |
| `kubectl delete`       | Remove resources         | `kubectl delete pod mypod`               |
| `kubectl logs`         | View container output    | `kubectl logs mypod`                     |
| `kubectl describe`     | Detailed resource info   | `kubectl describe pod mypod`             |
| `kubectl exec`         | Run command in container | `kubectl exec -it mypod -- bash`         |
| `kubectl port-forward` | Tunnel to local machine  | `kubectl port-forward svc/web 3000:3000` |

### Flags You'll See

| Flag  | Meaning              | Example                          |
| ----- | -------------------- | -------------------------------- |
| `-n`  | Namespace            | `kubectl get pods -n wbot`       |
| `-f`  | Follow/file          | `kubectl logs -f mypod` (follow) |
| `-l`  | Label selector       | `kubectl get pods -l app=web`    |
| `-o`  | Output format        | `kubectl get pods -o yaml`       |
| `-w`  | Watch (live updates) | `kubectl get pods -w`            |
| `-it` | Interactive terminal | `kubectl exec -it mypod -- bash` |

---

## Executive Summary

This plan deploys the full Wbot stack (AI backend, web frontend, Redis) on a single Hetzner Cloud server running k3s. The existing Kubernetes manifests work unchanged.

| Aspect         | Details                             |
| -------------- | ----------------------------------- |
| **Provider**   | Hetzner Cloud (US - Ashburn, VA)    |
| **Server**     | CX22 (2 vCPU, 4GB RAM, 40GB SSD)    |
| **Cost**       | $5.39/month                         |
| **Kubernetes** | k3s (lightweight, production-ready) |
| **Scaling**    | Vertical → Horizontal → Managed     |

---

## Prerequisites

### 1. Hetzner Account Setup

**Note:** Hetzner is a German hosting company with US data centers. They're known for being extremely affordable with good performance.

1. Go to <https://www.hetzner.com/cloud>
2. Create account and verify email
3. Add payment method (credit card or PayPal)
4. (Optional) Enable 2FA for security

### 2. Local Tools Required

You need these command-line tools on your Mac:

#### Install with Homebrew (Recommended)

```bash
# If you don't have Homebrew, install it first:
# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install hcloud (Hetzner's CLI tool) and kubectl (Kubernetes CLI tool)
brew install hcloud kubectl
```

**What are these tools?**

- `hcloud` - Hetzner's command-line tool to manage servers
- `kubectl` - Kubernetes command-line tool (pronounced "cube-control" or "cube-c-t-l")

#### Verify Installation

```bash
# Check hcloud is installed (shows version number)
hcloud version

# Check kubectl is installed (shows version info)
kubectl version --client
```

If you see version numbers, you're good! If you see "command not found", the installation failed.

### 3. SSH Key

**What is an SSH key?**
An SSH key is like a password, but much more secure. It's actually two files:

- **Private key** (stays on YOUR computer, never share!)
- **Public key** (you give this to servers you want to access)

When you connect, the server checks if your private key matches the public key you gave it.

```bash
# Check if you already have an SSH key
ls -la ~/.ssh/

# If you see files like id_ed25519 and id_ed25519.pub, you already have keys!
# If the folder is empty or doesn't exist, create a new key:

ssh-keygen -t ed25519 -C "wbot-hetzner"
```

**What the command does:**

- `ssh-keygen` - The program that creates SSH keys
- `-t ed25519` - The type of key (ed25519 is modern and secure)
- `-C "wbot-hetzner"` - A comment/label to identify this key

When prompted:

- **File location:** Press Enter to accept default (`~/.ssh/id_ed25519`)
- **Passphrase:** Optional, adds extra security (you'll type it each time you connect)

```bash
# View your PUBLIC key (this is safe to share)
cat ~/.ssh/id_ed25519.pub

# Output looks like:
# ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGSx... wbot-hetzner
```

### 4. Docker Desktop

You need Docker to build images.

1. Download Docker Desktop from <https://www.docker.com/products/docker-desktop/>
2. Install and launch it
3. Verify it's running:

```bash
docker --version
# Should output something like: Docker version 24.0.7, build afdd53b
```

**What is Docker Desktop?**
It's the app that runs Docker on your Mac. It includes:

- Docker Engine (runs containers)
- Docker CLI (command-line tool)
- Docker Compose (run multiple containers together)

---

## Phase 0: Local Testing with Docker Compose

**Goal:** Test your application locally BEFORE deploying to Hetzner.

**Why do this first?**

- Catch configuration errors locally
- No cost while experimenting
- Faster iteration (no network latency)
- Verify everything works together

### 0.1 Understanding Docker Compose

Your project already has `apps/ai/docker-compose.self-hosted.yml` which runs:

- AI Backend (FastAPI + Python)
- Redis (for caching)

For complete local testing, you can run this alongside your web development server.

### 0.2 Start Local Services

```bash
# Terminal 1: Start AI backend + Redis with Docker Compose
cd /Users/tom/code/Wbot
pnpm ai:up

# Wait ~30 seconds for services to start

# Terminal 2: Start web frontend in development mode
pnpm dev:web

# Terminal 3 (optional): View AI logs
pnpm ai:logs
```

**What's running:**

- AI Backend: <http://localhost:2024> (Docker)
- Web Frontend: <http://localhost:3000> (Dev server)
- Redis: `localhost:6379` (Docker)

### 0.3 Verify Local Setup

1. Open <http://localhost:3000> - you should see Wbot
2. Try chatting - it should work end-to-end
3. Check logs if anything fails

### 0.4 Stop Local Services

```bash
# Stop Docker Compose services
pnpm ai:down

# Stop web dev server (Ctrl+C in that terminal)
```

### Local Testing Checklist

- [ ] Docker Desktop installed and running
- [ ] AI backend + Redis started (`pnpm ai:up`)
- [ ] Web frontend started (`pnpm dev:web`)
- [ ] App accessible at <http://localhost:3000>
- [ ] Tested basic chat functionality
- [ ] Verified AI responses work
- [ ] Ready to deploy to Hetzner!

---

## Phase 1: Server Creation

**Goal:** Create a virtual server at Hetzner that will run your application 24/7.

### Option A: Via Hetzner Cloud Console (Recommended for Beginners)

This is the web-based approach - easier to visualize what you're doing.

1. Log into <https://console.hetzner.cloud>

2. **Create a new project:**
   - Click the "+" or "New Project" button
   - Name it "wbot"
   - Projects help organize your resources (like folders)

3. **Create the server:**
   - Click **Servers** in the left sidebar
   - Click **Add Server** button

4. **Configure the server:**

   | Setting        | Value                 | Why                                            |
   | -------------- | --------------------- | ---------------------------------------------- |
   | **Location**   | Ashburn, VA (ash)     | Closest to US users, low latency               |
   | **Image**      | Ubuntu 22.04          | Operating system - Ubuntu is beginner-friendly |
   | **Type**       | CX22                  | 2 vCPU, 4GB RAM - plenty for dev               |
   | **Networking** | Public IPv4 (checked) | So users can reach your app                    |
   | **SSH Key**    | Click "Add SSH Key"   | Paste your public key from above               |
   | **Name**       | `wbot-k3s`            | Descriptive name                               |

5. Click **Create & Buy Now**

6. **Save the IP address!** You'll see something like `5.161.123.45` - write this down.

**What just happened?**
Hetzner just created a virtual server for you in their Virginia data center. It's running Ubuntu Linux and waiting for you to connect. You're being charged $5.39/month starting now.

### Option B: Via Hetzner CLI (For Later)

Once you're comfortable, the CLI is faster:

```bash
# First time: Configure the CLI with your API token
# Get token from: Hetzner Console → Security → API Tokens → Generate
hcloud context create wbot
# Paste your API token when prompted

# Add your SSH key to Hetzner
hcloud ssh-key create --name wbot-key --public-key-from-file ~/.ssh/id_ed25519.pub

# Create the server
hcloud server create \
  --name wbot-k3s \
  --type cx22 \
  --image ubuntu-22.04 \
  --location ash \
  --ssh-key wbot-key

# Get the IP address
hcloud server ip wbot-k3s
```

**What the flags mean:**

- `--name wbot-k3s` - What to call this server
- `--type cx22` - The size (2 vCPU, 4GB RAM)
- `--image ubuntu-22.04` - The operating system to install
- `--location ash` - Ashburn, VA data center
- `--ssh-key wbot-key` - Which SSH key can access it

---

## Phase 2: Server Setup

**Goal:** Connect to your new server and install k3s (Kubernetes).

### 2.1 Connect to Your Server

```bash
# Replace 5.161.123.45 with YOUR server's IP address
ssh root@5.161.123.45
```

**What's happening:**

- `ssh` - Secure Shell, a way to control a remote computer
- `root` - The admin username on Linux
- `@5.161.123.45` - The server's IP address

**First time connecting?** You'll see:

```
The authenticity of host '5.161.123.45' can't be established.
Are you sure you want to continue connecting (yes/no)?
```

Type `yes` and press Enter. This is normal - you're confirming you trust this server.

**If successful, your prompt changes:**

```
root@wbot-k3s:~#
```

You're now controlling the remote server! Everything you type runs on THAT computer, not your Mac.

### 2.2 Initial Server Configuration

Run these commands **on the server** (you should see `root@wbot-k3s:~#`):

```bash
# Update the package list and upgrade all installed packages
# This is like updating apps on your phone - important for security!
apt update && apt upgrade -y
```

**What this does:**

- `apt update` - Refresh the list of available software
- `apt upgrade -y` - Install all available updates
- `-y` - Answer "yes" automatically (don't ask for confirmation)

```bash
# Install useful tools
apt install -y curl wget git htop nano
```

**What we're installing:**

- `curl` - Download files from URLs
- `wget` - Another download tool
- `git` - Version control (you probably have this locally too)
- `htop` - Visual system monitor (like Activity Monitor)
- `nano` - Simple text editor

```bash
# Set timezone (adjust for your location)
timedatectl set-timezone America/New_York
```

**Why?** Makes log timestamps match your local time.

```bash
# Configure firewall (UFW = Uncomplicated Firewall)
ufw allow 22/tcp      # SSH - so you can connect
ufw allow 80/tcp      # HTTP - web traffic
ufw allow 443/tcp     # HTTPS - secure web traffic
ufw allow 6443/tcp    # Kubernetes API - so kubectl works remotely
ufw --force enable    # Turn on the firewall

# Verify it's working
ufw status
```

**What's a firewall?**
It's like a security guard that blocks all incoming connections EXCEPT the ones you explicitly allow. Without these rules, you'd be locked out!

### 2.3 Install k3s

This is the exciting part - installing Kubernetes with ONE command:

```bash
# Download and run the k3s installer
curl -sfL https://get.k3s.io | sh -
```

**What's happening:**

- `curl -sfL https://get.k3s.io` - Download the installer script
- `|` - "Pipe" the output to the next command
- `sh -` - Run it as a shell script

This is a common pattern: download a script and run it immediately.

```bash
# Wait for k3s to fully start (about 30 seconds)
sleep 30

# Verify it's running - this should show your node
kubectl get nodes
```

**Expected output:**

```
NAME        STATUS   ROLES                  AGE   VERSION
wbot-k3s    Ready    control-plane,master   45s   v1.29.1+k3s1
```

**What does this mean?**

- `NAME: wbot-k3s` - Your server's name
- `STATUS: Ready` - Kubernetes is running and healthy! ✅
- `ROLES: control-plane,master` - This node is the boss
- `AGE: 45s` - How long since it started
- `VERSION: v1.29.1+k3s1` - Kubernetes version

```bash
# See all the system components (there are several!)
kubectl get pods -A
```

**The `-A` flag means "all namespaces".**
You'll see pods for CoreDNS (networking), Traefik (ingress), and more. These are Kubernetes system components - you don't need to manage them.

### 2.4 Get Kubeconfig for Local Access

**What's kubeconfig?**
It's a file that tells `kubectl` how to connect to your Kubernetes cluster. It contains:

- Server address
- Authentication credentials
- SSL certificates

**On the SERVER**, display the kubeconfig:

```bash
cat /etc/rancher/k3s/k3s.yaml
```

This outputs a bunch of YAML - **copy ALL of it** (Cmd+C).

**On your LOCAL Mac** (open a new terminal window):

```bash
# Create the .kube directory if it doesn't exist
mkdir -p ~/.kube

# Create and edit the kubeconfig file
nano ~/.kube/hetzner-k3s.yaml
```

1. Paste the content you copied (Cmd+V)
2. **IMPORTANT:** Find this line:

   ```yaml
   server: https://127.0.0.1:6443
   ```

3. Change `127.0.0.1` to your server's IP:

   ```yaml
   server: https://5.161.123.45:6443
   ```

4. Save: `Ctrl+O`, Enter, `Ctrl+X`

**Why change the IP?**
`127.0.0.1` means "this computer" - which was true when we ran the command ON the server. But from your Mac, you need the real IP address.

**Test the connection:**

```bash
# Tell kubectl where to find the config
export KUBECONFIG=~/.kube/hetzner-k3s.yaml

# Try to connect
kubectl get nodes
```

**If you see your node listed, you're connected!** 🎉

**Make it permanent:**
Add this to your shell profile so you don't have to export it every time:

```bash
echo 'export KUBECONFIG=~/.kube/hetzner-k3s.yaml' >> ~/.zshrc
source ~/.zshrc
```

---

## Phase 3: Deploy Wbot

**Goal:** Package your app into containers and deploy them to Kubernetes.

### 3.1 Build and Push Container Images

**What's happening here?**

1. Docker reads your Dockerfile and creates an "image" (a packaged version of your app)
2. You upload that image to a "registry" (cloud storage for images)
3. Later, Kubernetes will download and run that image

#### Option A: Docker Hub (Simplest - Recommended for Beginners)

Docker Hub is like GitHub but for container images. It's free for public images.

```bash
# Login to Docker Hub
# It will ask for your username and password
# (Create an account at https://hub.docker.com if you don't have one)
docker login
```

```bash
# Navigate to your project root
cd /Users/tom/code/Wbot

# Build the AI backend image
# -t = "tag" (name) the image
docker build -t YOUR_DOCKERHUB_USERNAME/wbot-ai:latest apps/ai
```

**What's happening:**

- Docker reads `apps/ai/Dockerfile`
- Downloads base image (Python)
- Copies your code
- Installs dependencies
- Creates a snapshot (image)

This takes 2-5 minutes the first time.

```bash
# Build the Web frontend image
# Note: -f specifies which Dockerfile to use
# The . at the end means "build from current directory"
docker build -t YOUR_DOCKERHUB_USERNAME/wbot-web:latest -f apps/web/Dockerfile .
```

```bash
# Push both images to Docker Hub
docker push YOUR_DOCKERHUB_USERNAME/wbot-ai:latest
docker push YOUR_DOCKERHUB_USERNAME/wbot-web:latest
```

**"Pushing" uploads your images to Docker Hub's servers.**
Anyone can now download them with `docker pull YOUR_DOCKERHUB_USERNAME/wbot-ai:latest`

### 3.2 Update Image References in Manifests

Your Kubernetes manifests currently reference `wbot-ai:latest` and `wbot-web:latest`. We need to update them to point to Docker Hub.

**Edit `k8s/base/ai-backend.yaml`:**

Find this line:

```yaml
image: wbot-ai:latest
```

Change it to:

```yaml
image: YOUR_DOCKERHUB_USERNAME/wbot-ai:latest
```

**Edit `k8s/base/web-frontend.yaml`:**

Find this line:

```yaml
image: wbot-web:latest
```

Change it to:

```yaml
image: YOUR_DOCKERHUB_USERNAME/wbot-web:latest
```

**Why do this?**
Kubernetes needs to know WHERE to download your images from. `wbot-ai:latest` would look locally, but your server doesn't have the images - they're on Docker Hub.

### 3.3 Create Namespace and Secrets

**What's a namespace?**
Namespaces are like folders in Kubernetes - they organize your resources and keep them separate from other apps.

**What are secrets?**
Secrets store sensitive data (API keys, passwords) securely. They're not stored in your code/git.

```bash
# Make sure KUBECONFIG is set (should be from earlier)
export KUBECONFIG=~/.kube/hetzner-k3s.yaml

# Create a namespace called "wbot"
kubectl create namespace wbot
```

**Create your secrets (replace with YOUR actual values):**

```bash
# Supabase secrets
kubectl create secret generic supabase-secrets \
  --namespace=wbot \
  --from-literal=SUPABASE_URL="https://your-project.supabase.co" \
  --from-literal=SUPABASE_ANON_KEY="eyJhbGciOiJI..." \
  --from-literal=SUPABASE_SERVICE_KEY="eyJhbGciOiJI..." \
  --from-literal=DATABASE_URI="postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

**Where do I get these values?**

- Supabase Dashboard → Project Settings → API
- DATABASE_URI: Supabase Dashboard → Settings → Database → Connection string (Session mode)

```bash
# AI API keys
kubectl create secret generic ai-api-keys \
  --namespace=wbot \
  --from-literal=ANTHROPIC_API_KEY="sk-ant-..." \
  --from-literal=OPENAI_API_KEY="sk-proj-..." \
  --from-literal=GOOGLE_API_KEY="AIza..." \
  --from-literal=LANGSMITH_API_KEY="lsv2_pt_..." \
  --from-literal=LANGSMITH_PROJECT="wbot-dev"
```

```bash
# Verify secrets were created
kubectl get secrets -n wbot
```

You should see `supabase-secrets` and `ai-api-keys` listed.

### 3.4 Deploy the Application

This is the moment of truth! 🚀

```bash
# From your Wbot project root
cd /Users/tom/code/Wbot

# Deploy everything using the dev overlay
kubectl apply -k k8s/overlays/dev
```

**What does this command do?**

- `kubectl apply` - Create or update resources
- `-k k8s/overlays/dev` - Use Kustomize to combine base + dev-specific configs

Kustomize reads all your YAML files, merges them, and sends them to Kubernetes.

```bash
# Watch the pods start up (Ctrl+C to exit)
kubectl get pods -n wbot -w
```

You'll see status changes:

1. `Pending` - Scheduling...
2. `ContainerCreating` - Downloading image...
3. `Running` - Success! ✅

**Check everything is healthy:**

```bash
kubectl get all -n wbot
```

**Expected output:**

```
NAME                               READY   STATUS    RESTARTS   AGE
pod/ai-backend-7d9f8b6c4-xj2k9     1/1     Running   0          2m
pod/web-frontend-5c8d7b4f6-mk3n8   1/1     Running   0          2m
pod/redis-0                        1/1     Running   0          2m

NAME                    TYPE        CLUSTER-IP      PORT(S)    AGE
service/ai-backend      ClusterIP   10.43.54.12     8000/TCP   2m
service/web-frontend    ClusterIP   10.43.128.45    3000/TCP   2m
service/redis           ClusterIP   None            6379/TCP   2m
```

**Reading the output:**

- `READY 1/1` - 1 out of 1 containers are ready
- `STATUS Running` - The container is running
- `RESTARTS 0` - Hasn't crashed and restarted
- All green = Success! 🎉

---

## Phase 4: Access Your Application

**Goal:** Actually use your deployed app!

### Option A: Port Forward (Best for Testing)

Port forwarding creates a tunnel from your local machine to the Kubernetes service.

```bash
# Forward the web frontend
kubectl port-forward -n wbot svc/web-frontend 3000:3000
```

**What this does:**

- Takes localhost:3000 on YOUR computer
- Tunnels it to the web-frontend service's port 3000
- Keep this terminal running!

Now open your browser: **<http://localhost:3000>**

You should see Wbot! 🎉

**Note:** This only works while the command is running. Press Ctrl+C to stop.

### Option B: NodePort (Direct Server Access)

NodePort exposes your service on the server's IP address.

```bash
# Change the service type to NodePort
kubectl patch svc web-frontend -n wbot -p '{"spec": {"type": "NodePort"}}'

# See what port was assigned
kubectl get svc web-frontend -n wbot
```

Output shows something like:

```
NAME           TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
web-frontend   NodePort   10.43.128.45   <none>        3000:32456/TCP   5m
```

The `32456` is your NodePort. Access via: **http://YOUR_SERVER_IP:32456**

### Option C: Ingress with Domain (Production)

For a real domain with HTTPS, see Phase 5 below.

---

## Phase 5: SSL/TLS Setup (Optional - Production)

**Goal:** Set up HTTPS with a real domain name.

This is optional for development but necessary before real users access your app.

### 5.1 Install cert-manager

cert-manager automatically gets free SSL certificates from Let's Encrypt.

```bash
# Install cert-manager (this installs several things)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# Wait for it to be ready (takes ~1 minute)
kubectl wait --for=condition=Available deployment --all -n cert-manager --timeout=300s
```

### 5.2 Point Your Domain to the Server

1. Go to your domain registrar (Cloudflare, Namecheap, etc.)
2. Add an A record:
   - Type: A
   - Name: `@` (or subdomain like `app`)
   - Value: Your server IP (e.g., `5.161.123.45`)
3. Wait 5-30 minutes for DNS to propagate

### 5.3 Create Certificate Issuer

Create a file called `cert-issuer.yaml`:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com # Change this!
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: traefik
```

```bash
kubectl apply -f cert-issuer.yaml
```

### 5.4 Update Ingress for TLS

Update `k8s/base/ingress.yaml` to use the certificate:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: wbot-ingress
  namespace: wbot
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - your-domain.com
      secretName: wbot-tls
  rules:
    - host: your-domain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-frontend
                port:
                  number: 3000
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: ai-backend
                port:
                  number: 8000
```

```bash
kubectl apply -f k8s/base/ingress.yaml
```

---

## Scaling Strategy

**As your app grows, here's how to handle more users.**

### Level 1: Vertical Scaling (Bigger Server)

The simplest approach - get a more powerful server.

| Server | Specs        | Monthly | Users    |
| ------ | ------------ | ------- | -------- |
| CX22   | 2 vCPU, 4GB  | $5.39   | ~10-50   |
| CX32   | 4 vCPU, 8GB  | $10.79  | ~50-200  |
| CX42   | 8 vCPU, 16GB | $21.59  | ~200-500 |

```bash
# Resize your server (causes ~2 min downtime)
hcloud server change-type wbot-k3s cx32 --upgrade-disk
```

### Level 2: Horizontal Scaling (More Servers)

Add worker nodes to your cluster for more capacity AND redundancy.

```bash
# On master, get the join token
sudo cat /var/lib/rancher/k3s/server/node-token

# Create a new server
hcloud server create --name wbot-k3s-worker-1 --type cx22 --image ubuntu-22.04 --location ash --ssh-key wbot-key

# SSH to the new server and join it to the cluster
ssh root@NEW_WORKER_IP
curl -sfL https://get.k3s.io | K3S_URL=https://MASTER_IP:6443 K3S_TOKEN=YOUR_TOKEN sh -
```

Then scale your deployments:

```bash
kubectl scale deployment ai-backend -n wbot --replicas=2
kubectl scale deployment web-frontend -n wbot --replicas=3
```

### Level 3: Managed Kubernetes

When you need enterprise-grade reliability, migrate to a managed service (your manifests work unchanged!).

---

## Monitoring & Maintenance

### Check Resource Usage

```bash
# See how much CPU/memory your pods use
kubectl top pods -n wbot

# See node-level resources
kubectl top nodes
```

### View Logs

```bash
# Follow AI backend logs (Ctrl+C to stop)
kubectl logs -n wbot -l app.kubernetes.io/name=ai-backend -f

# View web frontend logs
kubectl logs -n wbot -l app.kubernetes.io/name=web-frontend -f
```

### Restart a Deployment

If something seems stuck:

```bash
kubectl rollout restart deployment/ai-backend -n wbot
```

### Update Your App

When you push new code:

```bash
# 1. Build new images
docker build -t YOUR_USER/wbot-ai:latest apps/ai
docker build -t YOUR_USER/wbot-web:latest -f apps/web/Dockerfile .

# 2. Push to registry
docker push YOUR_USER/wbot-ai:latest
docker push YOUR_USER/wbot-web:latest

# 3. Restart deployments to pull new images
kubectl rollout restart deployment/ai-backend -n wbot
kubectl rollout restart deployment/web-frontend -n wbot
```

---

## Troubleshooting

### "kubectl: command not found"

```bash
# Make sure kubectl is installed
brew install kubectl
```

### "Unable to connect to the server"

```bash
# Check KUBECONFIG is set
echo $KUBECONFIG

# Should output: /Users/yourname/.kube/hetzner-k3s.yaml
# If empty, run:
export KUBECONFIG=~/.kube/hetzner-k3s.yaml
```

### Pod stuck in "ImagePullBackOff"

The image can't be downloaded. Check:

1. Image name is correct (typo?)
2. Image exists on Docker Hub
3. Image is public (or you've set up registry credentials)

```bash
# See detailed error
kubectl describe pod POD_NAME -n wbot
```

### Pod stuck in "CrashLoopBackOff"

The container starts but immediately crashes. Check logs:

```bash
kubectl logs POD_NAME -n wbot
```

### "OOMKilled" - Out of Memory

Your container used more memory than allowed. Either:

1. Increase memory limits in `k8s/overlays/dev/patches/resources-dev.yaml`
2. Or upgrade to a bigger server

---

## Quick Reference Commands

```bash
# ===== Setup =====
export KUBECONFIG=~/.kube/hetzner-k3s.yaml

# ===== View Resources =====
kubectl get all -n wbot          # Everything
kubectl get pods -n wbot         # Just pods
kubectl get svc -n wbot          # Just services

# ===== Logs =====
kubectl logs -n wbot -l app.kubernetes.io/name=ai-backend -f
kubectl logs -n wbot -l app.kubernetes.io/name=web-frontend -f

# ===== Restart =====
kubectl rollout restart deployment/ai-backend -n wbot
kubectl rollout restart deployment/web-frontend -n wbot

# ===== Access =====
kubectl port-forward -n wbot svc/web-frontend 3000:3000

# ===== Debug =====
kubectl describe pod POD_NAME -n wbot
kubectl exec -it POD_NAME -n wbot -- /bin/sh

# ===== Server =====
ssh root@$(hcloud server ip wbot-k3s)
```

---

## Deployment Checklist

### Initial Setup

- [ ] Create Hetzner account and add payment
- [ ] Generate SSH key (`ssh-keygen -t ed25519`)
- [ ] Install hcloud and kubectl (`brew install hcloud kubectl`)
- [ ] Test locally with Docker Compose

### Server Creation

- [ ] Create CX22 server in Ashburn
- [ ] Note the IP address
- [ ] SSH in successfully (`ssh root@IP`)

### Server Configuration

- [ ] Update packages (`apt update && apt upgrade -y`)
- [ ] Configure firewall (UFW)
- [ ] Install k3s (`curl -sfL https://get.k3s.io | sh -`)
- [ ] Verify with `kubectl get nodes`

### Local Configuration

- [ ] Copy kubeconfig from server
- [ ] Update IP address in kubeconfig
- [ ] Verify `kubectl get nodes` works locally

### Image Preparation

- [ ] Login to Docker Hub (`docker login`)
- [ ] Build AI image (`docker build -t user/wbot-ai:latest apps/ai`)
- [ ] Build Web image (`docker build -t user/wbot-web:latest -f apps/web/Dockerfile .`)
- [ ] Push both images
- [ ] Update image references in K8s manifests

### Deployment

- [ ] Create namespace (`kubectl create namespace wbot`)
- [ ] Create supabase-secrets
- [ ] Create ai-api-keys
- [ ] Apply deployment (`kubectl apply -k k8s/overlays/dev`)
- [ ] Verify all pods Running

### Testing

- [ ] Port forward web frontend
- [ ] Open <http://localhost:3000>
- [ ] Verify app works!

---

## Cost Summary

| Stage                | Monthly Cost |
| -------------------- | ------------ |
| Development (1 node) | $5.39        |
| Growth (3 nodes)     | $16.17       |
| Production (managed) | ~$48+        |

---

_Created: January 2026_
_For: Wbot Development Deployment_
_Difficulty: Beginner-friendly_
