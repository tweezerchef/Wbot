# Kubernetes Quick Start Guide

## Prerequisites Checklist

- [ ] Kubernetes cluster (v1.24+) accessible via kubectl
- [ ] Container registry access (Docker Hub, GCR, ECR, etc.)
- [ ] Ingress controller installed (nginx recommended)
- [ ] Supabase project created with credentials
- [ ] API keys: Anthropic (required), Google (required), OpenAI (optional)

## 1. Build and Push Images

```bash
# Login to your container registry
docker login your-registry.com

# Build AI backend
docker build -t your-registry.com/wbot-ai:latest apps/ai
docker push your-registry.com/wbot-ai:latest

# Build web frontend
docker build -t your-registry.com/wbot-web:latest apps/web
docker push your-registry.com/wbot-web:latest
```

## 2. Update Image References

Edit the following files and replace image names:

- `k8s/04-ai-backend.yaml` (line 23): `image: your-registry.com/wbot-ai:latest`
- `k8s/05-web-frontend.yaml` (line 23): `image: your-registry.com/wbot-web:latest`

Or use kustomization:

```bash
cd k8s
kustomize edit set image wbot-ai=your-registry.com/wbot-ai:latest
kustomize edit set image wbot-web=your-registry.com/wbot-web:latest
```

## 3. Create Secrets

```bash
kubectl create secret generic wbot-secrets \
  --namespace=wbot \
  --from-literal=SUPABASE_URL='https://xxxxx.supabase.co' \
  --from-literal=SUPABASE_ANON_KEY='eyJhbGc...' \
  --from-literal=SUPABASE_SERVICE_KEY='eyJhbGc...' \
  --from-literal=DATABASE_URI='postgresql://postgres.xxxxx:password@...' \
  --from-literal=ANTHROPIC_API_KEY='sk-ant-...' \
  --from-literal=GOOGLE_API_KEY='AIza...' \
  --from-literal=OPENAI_API_KEY='sk-...'
```

## 4. Update Domain in Ingress

Edit `k8s/06-ingress.yaml` and replace `wbot.example.com` with your domain (lines 33, 38).

## 5. Deploy Using Script

```bash
cd k8s
./deploy.sh
```

Or manually:

```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/02-configmap.yaml
# Create secrets (see step 3)
kubectl apply -f k8s/03-redis.yaml
kubectl apply -f k8s/04-ai-backend.yaml
kubectl apply -f k8s/05-web-frontend.yaml
kubectl apply -f k8s/06-ingress.yaml
```

Or with kustomize:

```bash
kubectl apply -k k8s/
```

## 6. Configure DNS

Get the ingress IP/hostname:

```bash
kubectl get ingress wbot-ingress -n wbot
```

Create a DNS A or CNAME record pointing your domain to this address.

## 7. Verify

```bash
# Check all resources
kubectl get all -n wbot

# Check logs
kubectl logs -n wbot -l app.kubernetes.io/name=wbot-ai --tail=50
kubectl logs -n wbot -l app.kubernetes.io/name=wbot-web --tail=50

# Test health endpoint
kubectl port-forward -n wbot svc/wbot-ai 8000:8000
curl http://localhost:8000/health
```

## 8. Access Application

Once DNS propagates, visit: `https://your-domain.com`

## Troubleshooting

**Pods not starting?**

```bash
kubectl describe pod <pod-name> -n wbot
```

**Can't connect to database?**

```bash
# Verify DATABASE_URI is correct (Session mode, port 5432)
kubectl get secret wbot-secrets -n wbot -o jsonpath='{.data.DATABASE_URI}' | base64 -d
```

**Ingress not working?**

```bash
kubectl describe ingress wbot-ingress -n wbot
# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

## Next Steps

- Set up TLS/SSL with cert-manager (see README.md)
- Configure horizontal pod autoscaling
- Set up monitoring and logging
- Configure persistent storage for Redis
- Implement backup strategy

## Useful Commands

```bash
# View logs
kubectl logs -n wbot -l app.kubernetes.io/name=wbot-ai -f

# Scale deployment
kubectl scale deployment wbot-ai --replicas=5 -n wbot

# Update image
kubectl set image deployment/wbot-ai wbot-ai=your-registry.com/wbot-ai:v2 -n wbot

# Restart deployment
kubectl rollout restart deployment/wbot-ai -n wbot

# Delete everything
kubectl delete namespace wbot
```
