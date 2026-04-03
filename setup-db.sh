#!/bin/bash
# Asesor Virtual — Database Setup Script
# Usage: ./setup-db.sh
# Requires: psql available in PATH, DATABASE_URL set in backend/.env

set -e

echo "🚀 Asesor Virtual — Database Setup"
echo "====================================="

# Load env
if [ -f ./backend/.env ]; then
  export $(grep -v '^#' ./backend/.env | xargs)
elif [ -f ./backend/.env.local ]; then
  export $(grep -v '^#' ./backend/.env.local | xargs)
else
  echo "❌ No .env file found in ./backend — copy .env.example first"
  exit 1
fi

# Check required vars
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is required in backend/.env"
  exit 1
fi

PSQL_CMD="psql $DATABASE_URL -v ON_ERROR_STOP=1"

echo ""
echo "📋 Running migrations in order..."
echo "  → 000_supabase_rls_setup.sql"
$PSQL_CMD -f ./backend/src/database/migrations/000_supabase_rls_setup.sql
echo "  → 001_initial_schema.sql"
$PSQL_CMD -f ./backend/src/database/migrations/001_initial_schema.sql
echo "  → 002_multi_advisor.sql"
$PSQL_CMD -f ./backend/src/database/migrations/002_multi_advisor.sql
echo "  → 003_advisor_tools.sql"
$PSQL_CMD -f ./backend/src/database/migrations/003_advisor_tools.sql
echo "✅ Migrations completed"

echo ""
echo "🌱 Running seeds..."
if [ -f ./backend/src/database/seeds/001_contract_templates.sql ]; then
  echo "  → 001_contract_templates.sql"
  $PSQL_CMD -f ./backend/src/database/seeds/001_contract_templates.sql
fi
if [ -f ./backend/src/database/seeds/002_legal_knowledge_ar.sql ]; then
  echo "  → 002_legal_knowledge_ar.sql"
  $PSQL_CMD -f ./backend/src/database/seeds/002_legal_knowledge_ar.sql
fi
echo "✅ Seeds completed"

echo ""
echo "🔍 Indexing legal documents for RAG (OpenAI embeddings)..."
cd backend
npm run db:index-legal
cd ..
echo "✅ RAG indexing completed"

echo ""
echo "🎉 Asesor Virtual — database setup complete!"
echo ""
echo "Next steps:"
echo "  1. cd backend && npm run start:dev"
echo "  2. cd frontend && npm run dev"
echo "  3. Open http://localhost:3000"
