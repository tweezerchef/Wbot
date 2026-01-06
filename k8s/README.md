# Kubernetes Deployment Guide for Wbot

This directory contains Kubernetes manifests for deploying the Wbot AI Wellness Companion application to a Kubernetes cluster.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Internet / Users                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Ingress Controller                         │
│              (nginx/traefik/cloud provider)                  │
└───────┬─────────────────────────────────────────┬───────────┘
        │                                         │
        │ /api, /health                          │ /
        ▼                                         ▼
┌──────────────────┐                    ┌──────────────────┐
│   wbot-ai:8000   │                    │  wbot-web:3000   │
│   (AI Backend)   │                    │   (Frontend)     │
│   Python + LLM   │                    │  TanStack Start  │
└────────┬─────────┘                    └──────────────────┘
         │
         │ Cache
         ▼
┌──────────────────┐
│  redis:6379      │
│  (Embedding      │
│   Cache)         │
└──────────────────┘
         │
         │ Database
         ▼
┌──────────────────────────────────────────────────────────────┐
│              Supabase (External - Not in K8s)                 │
│                   PostgreSQL + Auth                           │
└──────────────────────────────────────────────────────────────┘
```

## Prerequisites

### 1. Kubernetes Cluster

- Kubernetes version 1.24+
- kubectl configured to access your cluster
- Sufficient resources:
  - Minimum: 4 CPU cores, 8GB RAM
  - Recommended: 8 CPU cores, 16GB RAM

### 2. Container Registry

Build and push Docker images to your registry:

```bash
# Build AI backend
docker build -t your-registry.com/wbot-ai:latest apps/ai
docker push your-registry.com/wbot-ai:latest

# Build web frontend
docker build -t your-registry.com/wbot-web:latest apps/web
docker push your-registry.com/wbot-web:latest
```

Update image references in:

- k8s/04-ai-backend.yaml
- k8s/05-web-frontend.yaml

### 3. Ingress Controller

Install an ingress controller if not already available.

### 4. External Dependencies

**Supabase Account:**

- Create a project at supabase.com
- Note down: Project URL, Anon Key, Service Key
- Get Database URI from Settings > Database > Connection string

**API Keys:**

- Anthropic API key for Claude LLM
- Google API key for embeddings
- OpenAI API key (optional, for meditation TTS)

## Deployment Steps

### Step 1: Create Namespace

```bash
kubectl apply -f k8s/00-namespace.yaml
```

### Step 2: Configure Secrets

```bash
kubectl create secret generic wbot-secrets \
  --namespace=wbot \
  --from-literal=SUPABASE_URL='https://your-project.supabase.co' \
  --from-literal=SUPABASE_ANON_KEY='your-anon-key' \
  --from-literal=SUPABASE_SERVICE_KEY='your-service-key' \
  --from-literal=DATABASE_URI='postgresql://...' \
  --from-literal=ANTHROPIC_API_KEY='sk-ant-...' \
  --from-literal=GOOGLE_API_KEY='your-google-key' \
  --from-literal=OPENAI_API_KEY='sk-...'
```

### Step 3: Apply ConfigMap

```bash
kubectl apply -f k8s/02-configmap.yaml
```

### Step 4: Deploy Redis

```bash
kubectl apply -f k8s/03-redis.yaml
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=redis -n wbot --timeout=120s
```

### Step 5: Deploy AI Backend

```bash
kubectl apply -f k8s/04-ai-backend.yaml
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=wbot-ai -n wbot --timeout=300s
```

### Step 6: Deploy Web Frontend

```bash
kubectl apply -f k8s/05-web-frontend.yaml
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=wbot-web -n wbot --timeout=180s
```

### Step 7: Configure and Deploy Ingress

Edit k8s/06-ingress.yaml and update your domain, then:

```bash
kubectl apply -f k8s/06-ingress.yaml
```

### Step 8: Configure DNS

Point your domain to the ingress IP/hostname:

```bash
kubectl get ingress wbot-ingress -n wbot
```

### Step 9: Verify Deployment

```bash
kubectl get all -n wbot
```

## Quick Deploy Script

```bash
# Deploy everything at once
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/02-configmap.yaml
# Create secrets first (see Step 2)
kubectl apply -f k8s/03-redis.yaml
kubectl apply -f k8s/04-ai-backend.yaml
kubectl apply -f k8s/05-web-frontend.yaml
kubectl apply -f k8s/06-ingress.yaml
```

## Monitoring and Logging

### View Logs

```bash
# All pods
kubectl logs -n wbot --all-containers=true --tail=100 -f

# Specific service
kubectl logs -n wbot -l app.kubernetes.io/name=wbot-ai --tail=100 -f
kubectl logs -n wbot -l app.kubernetes.io/name=wbot-web --tail=100 -f
```

### Pod Status

```bash
kubectl get pods -n wbot -w
```

## Scaling

```bash
# Manual scaling
kubectl scale deployment wbot-ai --replicas=5 -n wbot
kubectl scale deployment wbot-web --replicas=3 -n wbot

# Auto-scaling
kubectl autoscale deployment wbot-ai --namespace=wbot --cpu-percent=70 --min=2 --max=10
kubectl autoscale deployment wbot-web --namespace=wbot --cpu-percent=70 --min=2 --max=5
```

## Troubleshooting

### Check Pod Events

```bash
kubectl describe pod <pod-name> -n wbot
```

### Test Service Connectivity

```bash
kubectl port-forward -n wbot svc/wbot-ai 8000:8000
curl http://localhost:8000/health
```

### Debug Container

```bash
kubectl run debug --rm -it --image=curlimages/curl -n wbot -- sh
```

## Updates and Rollouts

```bash
# Update image
kubectl set image deployment/wbot-ai wbot-ai=your-registry.com/wbot-ai:v2.0.0 -n wbot

# Watch rollout
kubectl rollout status deployment/wbot-ai -n wbot

# Rollback
kubectl rollout undo deployment/wbot-ai -n wbot
```

## Clean Up

```bash
kubectl delete namespace wbot
```

## Additional Resources

- Kubernetes Documentation: https://kubernetes.io/docs/
- kubectl Cheat Sheet: https://kubernetes.io/docs/reference/kubectl/cheatsheet/
- Supabase Documentation: https://supabase.com/docs
