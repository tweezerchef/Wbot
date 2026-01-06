#!/bin/bash
# Quick deployment script for Wbot on Kubernetes

set -e

NAMESPACE="wbot"

echo "🚀 Deploying Wbot to Kubernetes..."
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

echo "✅ Kubernetes cluster is accessible"
echo ""

# Step 1: Create namespace
echo "📦 Creating namespace..."
kubectl apply -f 00-namespace.yaml

# Step 2: Check if secrets exist
if kubectl get secret wbot-secrets -n $NAMESPACE &> /dev/null; then
    echo "✅ Secrets already exist"
else
    echo "⚠️  WARNING: Secrets not found!"
    echo "Please create secrets manually:"
    echo ""
    echo "kubectl create secret generic wbot-secrets \\"
    echo "  --namespace=$NAMESPACE \\"
    echo "  --from-literal=SUPABASE_URL='https://your-project.supabase.co' \\"
    echo "  --from-literal=SUPABASE_ANON_KEY='your-anon-key' \\"
    echo "  --from-literal=SUPABASE_SERVICE_KEY='your-service-key' \\"
    echo "  --from-literal=DATABASE_URI='postgresql://...' \\"
    echo "  --from-literal=ANTHROPIC_API_KEY='sk-ant-...' \\"
    echo "  --from-literal=GOOGLE_API_KEY='your-google-key' \\"
    echo "  --from-literal=OPENAI_API_KEY='sk-...'"
    echo ""
    read -p "Press enter to continue after creating secrets (or Ctrl+C to exit)..."
fi

# Step 3: Apply ConfigMap
echo "📝 Applying ConfigMap..."
kubectl apply -f 02-configmap.yaml

# Step 4: Deploy Redis
echo "🗄️  Deploying Redis..."
kubectl apply -f 03-redis.yaml
echo "⏳ Waiting for Redis to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=redis -n $NAMESPACE --timeout=120s
echo "✅ Redis is ready"

# Step 5: Deploy AI Backend
echo "🤖 Deploying AI Backend..."
kubectl apply -f 04-ai-backend.yaml
echo "⏳ Waiting for AI Backend to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=wbot-ai -n $NAMESPACE --timeout=300s
echo "✅ AI Backend is ready"

# Step 6: Deploy Web Frontend
echo "🌐 Deploying Web Frontend..."
kubectl apply -f 05-web-frontend.yaml
echo "⏳ Waiting for Web Frontend to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=wbot-web -n $NAMESPACE --timeout=180s
echo "✅ Web Frontend is ready"

# Step 7: Deploy Ingress
echo "🌍 Deploying Ingress..."
kubectl apply -f 06-ingress.yaml

echo ""
echo "✨ Deployment complete!"
echo ""
echo "📊 Current status:"
kubectl get all -n $NAMESPACE
echo ""
echo "🔗 Get ingress information:"
echo "kubectl get ingress wbot-ingress -n $NAMESPACE"
echo ""
echo "📝 View logs:"
echo "kubectl logs -n $NAMESPACE -l app.kubernetes.io/name=wbot-ai --tail=100 -f"
echo "kubectl logs -n $NAMESPACE -l app.kubernetes.io/name=wbot-web --tail=100 -f"
