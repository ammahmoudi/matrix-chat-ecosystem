-- This runs automatically on first postgres start (fresh install only).
-- For existing installs, run manually:
--   docker exec mamood-postgres psql -U client -c "CREATE DATABASE mas ENCODING 'UTF8' LC_COLLATE='C' LC_CTYPE='C' TEMPLATE=template0;"

SELECT 'CREATE DATABASE mas ENCODING ''UTF8'' LC_COLLATE=''C'' LC_CTYPE=''C'' TEMPLATE=template0'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mas')\gexec
