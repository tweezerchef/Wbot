# Kubernetes Manifests Overview

## Directory Structure

```
k8s/
├── 00-namespace.yaml          # Namespace definition
├── 01-secrets.yaml            # Secrets template (DO NOT commit real values!)
├── 02-configmap.yaml          # Non-sensitive configuration
├── 03-redis.yaml              # Redis deployment + service
├── 04-ai-backend.yaml         # AI backend deployment + service
├── 05-web-frontend.yaml       # Web frontend deployment + service
├── 06-ingress.yaml            # Ingress for external access
├── kustomization.yaml         # Kustomize configuration
├── values.yaml                # Configuration values
├── deploy.sh                  # Quick deployment script
├── README.md                  # Comprehensive documentation
├── QUICKSTART.md              # Quick start guide
└── MANIFEST_OVERVIEW.md       # This file
```

## Manifest Details

### 00-namespace.yaml

Creates the `wbot` namespace to isolate all application resources.

**Resources:**

- 1 Namespace

### 01-secrets.yaml

Template for sensitive configuration. Must be filled with real values before deployment.

**Contains:**

- Supabase credentials (URL, anon key, service key)
- Database connection string
- API keys (Anthropic, OpenAI, Google)
- LangSmith API key (optional)

**⚠️ Security Note:** Never commit this file with real values to version control!

### 02-configmap.yaml

Non-sensitive configuration shared across services.

**Contains:**

- Redis connection URL
- CORS settings
- LangSmith configuration
- Python environment variables

**Resources:**

- 1 ConfigMap

### 03-redis.yaml

Redis cache for AI backend embedding cache.

**Resources:**

- 1 Deployment (1 replica)
- 1 Service (ClusterIP)
- 1 EmptyDir volume (⚠️ use PVC in production)

**Ports:**

- Internal: 6379

**Health Checks:**

- Liveness: redis-cli ping
- Readiness: redis-cli ping

### 04-ai-backend.yaml

Python LangGraph AI service with FastAPI.

**Resources:**

- 1 Deployment (2 replicas, configurable)
- 1 Service (ClusterIP)

**Ports:**

- Internal: 8000

**Health Checks:**

- Liveness: GET /health (30s initial delay)
- Readiness: GET /health (10s initial delay)

**Resource Limits:**

- CPU: 500m-2000m
- Memory: 512Mi-2Gi

**Dependencies:**

- Redis service
- Supabase (external)
- Anthropic API
- Google API

### 05-web-frontend.yaml

TanStack Start React application.

**Resources:**

- 1 Deployment (2 replicas, configurable)
- 1 Service (ClusterIP)

**Ports:**

- Internal: 3000 → External: 80

**Health Checks:**

- Liveness: GET / (15s initial delay)
- Readiness: GET / (5s initial delay)

**Resource Limits:**

- CPU: 100m-1000m
- Memory: 256Mi-1Gi

**Dependencies:**

- AI backend service (internal)
- Supabase (external)

### 06-ingress.yaml

Routes external traffic to services.

**Resources:**

- 1 Ingress

**Routes:**

- `/api/*` → wbot-ai:8000
- `/health` → wbot-ai:8000
- `/*` → wbot-web:80

**Features:**

- TLS/SSL termination
- CORS support
- SSE streaming (long timeout)
- Rate limiting
- cert-manager integration

**Required:**

- Ingress controller (nginx recommended)
- DNS configuration
- TLS certificate (manual or cert-manager)

## Deployment Order

1. **Namespace** (00-namespace.yaml)
2. **Secrets** (manually create, or use 01-secrets.yaml)
3. **ConfigMap** (02-configmap.yaml)
4. **Redis** (03-redis.yaml) - Wait for ready
5. **AI Backend** (04-ai-backend.yaml) - Wait for ready
6. **Web Frontend** (05-web-frontend.yaml) - Wait for ready
7. **Ingress** (06-ingress.yaml)

## Resource Requirements

### Minimum Cluster Resources

- **CPU:** 4 cores
- **Memory:** 8GB RAM
- **Storage:** 20GB (for images and logs)

### Per-Service Resources

| Service      | Replicas | CPU (req/limit) | Memory (req/limit) |
| ------------ | -------- | --------------- | ------------------ |
| Redis        | 1        | 100m / 500m     | 128Mi / 512Mi      |
| AI Backend   | 2        | 500m / 2000m    | 512Mi / 2Gi        |
| Web Frontend | 2        | 100m / 1000m    | 256Mi / 1Gi        |
| **Total**    | **5**    | **2.4 / 9**     | **2.3Gi / 8.5Gi**  |

## Scalability

### Horizontal Scaling

Both AI backend and web frontend support horizontal scaling:

```bash
# Manual
kubectl scale deployment wbot-ai --replicas=10 -n wbot

# Auto-scaling
kubectl autoscale deployment wbot-ai --cpu-percent=70 --min=2 --max=10 -n wbot
```

### Vertical Scaling

Adjust resource limits in deployment manifests and reapply.

### Redis Scaling

Redis runs as single instance (suitable for cache). For high availability:

- Use Redis Sentinel
- Or use managed Redis service

## Security Considerations

### Secrets Management

- ✅ Secrets stored in Kubernetes Secrets
- ✅ Never committed to version control
- 🔄 Consider: External Secrets Operator for production
- 🔄 Consider: HashiCorp Vault, AWS Secrets Manager, etc.

### Network Policies

Not included by default. Add network policies to restrict pod-to-pod communication.

### Pod Security

- All services run as non-root (recommended)
- Read-only root filesystem (recommended)
- Drop all capabilities (recommended)

### TLS/SSL

- Ingress handles TLS termination
- Use cert-manager for automatic certificate management
- Or provide manual certificates

## High Availability

### Current Setup

- AI Backend: 2 replicas
- Web Frontend: 2 replicas
- Redis: 1 replica (single point of failure)

### Production Recommendations

1. **Redis:** Use managed Redis or Redis Sentinel
2. **Pod Disruption Budgets:** Ensure minimum replicas during maintenance
3. **Anti-affinity:** Spread pods across nodes
4. **Multiple zones:** Deploy across availability zones
5. **Load balancing:** Use ingress controller with proper load balancing

## Monitoring and Observability

### Health Checks

All services have liveness and readiness probes configured.

### Logs

Access via kubectl:

```bash
kubectl logs -n wbot -l app.kubernetes.io/name=wbot-ai --tail=100 -f
```

### Recommended Tools

- **Metrics:** Prometheus + Grafana
- **Logging:** ELK Stack or Loki
- **Tracing:** LangSmith (already configured)
- **APM:** Datadog, New Relic, or similar

## Cost Optimization

### Resource Requests

Set appropriate requests to avoid over-provisioning:

- Start with provided values
- Monitor actual usage
- Adjust based on metrics

### Autoscaling

Use HPA to scale down during low traffic periods.

### Spot Instances

Use spot/preemptible instances for non-critical workloads:

- Web frontend (stateless, can handle interruptions)
- AI backend workers (with proper queue management)

## Backup and Disaster Recovery

### What to Backup

1. **Secrets:** Keep secure offline copy
2. **ConfigMaps:** Version controlled in Git
3. **Redis data:** If persistence enabled
4. **Application data:** Handled by Supabase

### Disaster Recovery

1. Keep manifests in version control
2. Document deployment procedure
3. Regular restore testing
4. Supabase handles database backups

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build and push
  run: |
    docker build -t $REGISTRY/wbot-ai:${{ github.sha }} apps/ai
    docker push $REGISTRY/wbot-ai:${{ github.sha }}

- name: Deploy
  run: |
    kubectl set image deployment/wbot-ai \
      wbot-ai=$REGISTRY/wbot-ai:${{ github.sha }} -n wbot
```

### GitOps (ArgoCD/FluxCD)

Point to this k8s directory for automatic sync.

## Additional Files

### kustomization.yaml

Kustomize configuration for:

- Easy overlay management (dev/staging/prod)
- Image tag management
- Common labels

Usage:

```bash
kubectl apply -k k8s/
```

### values.yaml

Configuration values for easy customization:

- Image repositories and tags
- Replica counts
- Resource limits
- Domain configuration

### deploy.sh

Automated deployment script with validation and health checks.

Usage:

```bash
cd k8s && ./deploy.sh
```

## Next Steps

1. Review and customize values.yaml
2. Create secrets with your credentials
3. Update image references
4. Configure domain in ingress
5. Run deploy.sh or apply manifests
6. Set up monitoring
7. Configure backups
8. Document runbooks

## Support

For detailed instructions, see:

- **README.md** - Comprehensive guide
- **QUICKSTART.md** - Quick start guide
- **Main README** - Application documentation
