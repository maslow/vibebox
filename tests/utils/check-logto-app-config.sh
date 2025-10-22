#!/bin/bash
# Quick check of Logto application configuration via database

echo "🔍 Checking Logto Application Configuration"
echo "============================================"
echo ""

docker exec vibebox-postgres psql -U postgres -d logto -c "
SELECT
    id,
    name,
    type,
    oidc_client_metadata->>'redirectUris' as redirect_uris
FROM applications
WHERE id = '4bq12e6inwe0grgandxsx';
" 2>/dev/null || echo "Failed to query database"
