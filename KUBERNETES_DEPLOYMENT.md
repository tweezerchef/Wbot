# Kubernetes Deployment Summary for Wbot

## 📦 What Was Created

Complete Kubernetes manifests have been generated in the `k8s/` directory:

### Core Manifests (7 files)

1. **00-namespace.yaml** - Dedicated namespace for isolation
2. **01-secrets.yaml** - Secret template for credentials (needs customization)
3. **02-configmap.yaml** - Non-sensitive configuration
4. **03-redis.yaml** - Redis cache deployment and service
5. **04-ai-backend.yaml** - Python AI service (LangGraph + FastAPI)
6. **05-web-frontend.yaml** - React frontend (TanStack Start)
7. **06-ingress.yaml** - External access routing with TLS

### Supporting Files (6 files)

- **README.md** - Comprehensive deployment documentation
- **QUICKSTART.md** - Quick start guide for fast deployment
- **MANIFEST_OVERVIEW.md** - Detailed manifest descriptions
- **kustomization.yaml** - Kustomize configuration
- **values.yaml** - Centralized configuration values
- **deploy.sh** - Automated deployment script

### Additional Files Created

- **apps/web/Dockerfile** - Production build for web frontend

## 🏗️ Architecture

```
Internet → Ingress → ┌─ Web Frontend (wbot-web:3000)
                     └─ AI Backend (wbot-ai:8000) → Redis (redis:6379)
                                                  └→ Supabase (external)
```

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Verify cluster access
kubectl cluster-info

# Verify you have:
# - Container registry access
# - Supabase project credentials
# - API keys (Anthropic, Google, OpenAI)
```

### 2. Build and Push Images

```bash
# Build AI backend
docker build -t your-registry.com/wbot-ai:latest apps/ai
docker push your-registry.com/wbot-ai:latest

# Build web frontend
docker build -t your-registry.com/wbot-web:latest apps/web
docker push your-registry.com/wbot-web:latest
```

### 3. Update Image References

Edit these files or use kustomize:

- `k8s/04-ai-backend.yaml` - Update image name
- `k8s/05-web-frontend.yaml` - Update image name

### 4. Create Secrets

```bash
kubectl create secret generic wbot-secrets \
  --namespace=wbot \
  --from-literal=SUPABASE_URL='https://xxxxx.supabase.co' \
  --from-literal=SUPABASE_ANON_KEY='eyJhbGc...' \
  --from-literal=SUPABASE_SERVICE_KEY='eyJhbGc...' \
  --from-literal=DATABASE_URI='postgresql://...' \
  --from-literal=ANTHROPIC_API_KEY='sk-ant-...' \
  --from-literal=GOOGLE_API_KEY='AIza...' \
  --from-literal=OPENAI_API_KEY='sk-...'
```

### 5. Configure Domain

Edit `k8s/06-ingress.yaml` and replace `wbot.example.com` with your domain.

### 6. Deploy

```bash
cd k8s
./deploy.sh
```

Or manually:

```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/02-configmap.yaml
# Create secrets (see step 4)
kubectl apply -f k8s/03-redis.yaml
kubectl apply -f k8s/04-ai-backend.yaml
kubectl apply -f k8s/05-web-frontend.yaml
kubectl apply -f k8s/06-ingress.yaml
```

Or with kustomize:

```bash
kubectl apply -k k8s/
```

### 7. Configure DNS

```bash
# Get ingress address
kubectl get ingress wbot-ingress -n wbot

# Point your domain to this address
# Create DNS A or CNAME record
```

### 8. Verify

```bash
kubectl get all -n wbot
kubectl logs -n wbot -l app.kubernetes.io/name=wbot-ai --tail=50
```

## 📊 Resource Requirements

### Minimum Cluster

- **CPU:** 4 cores
- **Memory:** 8GB RAM
- **Kubernetes:** v1.24+

### Service Resources

| Service      | Replicas | CPU        | Memory      |
| ------------ | -------- | ---------- | ----------- |
| Redis        | 1        | 100m-500m  | 128Mi-512Mi |
| AI Backend   | 2        | 500m-2000m | 512Mi-2Gi   |
| Web Frontend | 2        | 100m-1000m | 256Mi-1Gi   |

## 🔧 Configuration

### Scaling

```bash
# Manual scaling
kubectl scale deployment wbot-ai --replicas=5 -n wbot

# Auto-scaling
kubectl autoscale deployment wbot-ai --cpu-percent=70 --min=2 --max=10 -n wbot
```

### Update Application

```bash
# Update image
kubectl set image deployment/wbot-ai wbot-ai=your-registry.com/wbot-ai:v2.0.0 -n wbot

# Watch rollout
kubectl rollout status deployment/wbot-ai -n wbot

# Rollback if needed
kubectl rollout undo deployment/wbot-ai -n wbot
```

### View Logs

```bash
# All services
kubectl logs -n wbot --all-containers=true --tail=100 -f

# Specific service
kubectl logs -n wbot -l app.kubernetes.io/name=wbot-ai -f
kubectl logs -n wbot -l app.kubernetes.io/name=wbot-web -f
```

## 🔒 Security

### Secrets Management

- ✅ Kubernetes Secrets for credentials
- ⚠️ Never commit `01-secrets.yaml` with real values
- 💡 Consider External Secrets Operator for production

### TLS/SSL

```bash
# Install cert-manager for automatic certificates
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# Create Let's Encrypt issuer
kubectl apply -f - <<ISSUER
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
ISSUER
```

## 🚨 Troubleshooting

### Pods Not Starting

```bash
kubectl describe pod <pod-name> -n wbot
kubectl logs <pod-name> -n wbot
```

### Database Connection Issues

```bash
# Verify DATABASE_URI
kubectl get secret wbot-secrets -n wbot -o jsonpath='{.data.DATABASE_URI}' | base64 -d

# Test from pod
kubectl exec -it -n wbot deployment/wbot-ai -- python -c "
import psycopg
conn = psycopg.connect('$DATABASE_URI')
print('Connected!')
"
```

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints -n wbot

# Port forward for testing
kubectl port-forward -n wbot svc/wbot-ai 8000:8000
curl http://localhost:8000/health
```

### Ingress Not Working

```bash
# Check ingress status
kubectl describe ingress wbot-ingress -n wbot

# Check ingress controller
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

## 📚 Documentation

Detailed guides in `k8s/` directory:

1. **k8s/QUICKSTART.md** - Fast deployment guide
2. **k8s/README.md** - Complete documentation with:
   - Prerequisites and setup
   - Step-by-step deployment
   - TLS configuration
   - Monitoring and logging
   - Production considerations
   - Troubleshooting guide

3. **k8s/MANIFEST_OVERVIEW.md** - Detailed manifest descriptions:
   - Each file explained
   - Resource requirements
   - Deployment order
   - Security considerations
   - High availability setup

## 🎯 Production Checklist

Before going to production:

- [ ] Use real container registry (not latest tag)
- [ ] Configure persistent storage for Redis
- [ ] Set up TLS with cert-manager
- [ ] Configure horizontal pod autoscaling
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure log aggregation
- [ ] Implement network policies
- [ ] Set up pod disruption budgets
- [ ] Configure resource quotas
- [ ] Use External Secrets Operator
- [ ] Set up CI/CD pipeline
- [ ] Document runbooks
- [ ] Test disaster recovery

## 🔗 Next Steps

1. **Review Configuration**
   - Customize `k8s/values.yaml`
   - Update image references
   - Set your domain

2. **Deploy to Staging**
   - Test deployment process
   - Verify all services
   - Test application functionality

3. **Production Deployment**
   - Follow production checklist
   - Set up monitoring
   - Configure backups

4. **Monitoring Setup**
   - Install Prometheus/Grafana
   - Configure alerts
   - Set up dashboards

## 🆘 Support

- **Application Issues:** Check main README.md
- **Kubernetes Issues:** See k8s/README.md
- **Quick Help:** See k8s/QUICKSTART.md

## 🧹 Clean Up

Remove everything:

```bash
kubectl delete namespace wbot
```

---

**Generated:** January 6, 2026
**Kubernetes Version:** v1.24+
**Application:** Wbot AI Wellness Companion
