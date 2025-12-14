SET search_path TO public;

-- Create logical schemas to organize our tables
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS va;
CREATE SCHEMA IF NOT EXISTS knowledge;
CREATE SCHEMA IF NOT EXISTS connections;

-------------------------------------
-- Schema: core
-- For Tenants, Users, and Billing
-------------------------------------

-- TENANTS: Your master list of customers
CREATE TABLE core.Tenants (
    TenantID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    CompanyName TEXT,
    WorkspaceDomain TEXT,
    SubscriptionStatus TEXT NOT L NULL DEFAULT 'Trial', -- e.g., Trial, Active, Cancelled
    ActiveModules JSONB NOT NULL DEFAULT '["va"]' -- Stores purchased modules, e.g., ["va", "projects"]
    -- CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- USERS: The individuals who log in to your web app
CREATE TABLE core.Users (
    UserID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    TenantID UUID NOT NULL REFERENCES core.Tenants(TenantID),
    Email TEXT NOT NULL UNIQUE,
    Role TEXT NOT NULL DEFAULT 'User', -- e.g., Admin, User
    Preferences JSONB, -- For VA personalization
    CustomInstructions TEXT -- For the VA
    -- LastLogin TIMESTAMP WITH TIME ZONE
);

-- TENANT_SETTINGS: Pointers to this tenant's data
CREATE TABLE core.TenantSettings (
    SettingID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    TenantID UUID NOT NULL UNIQUE REFERENCES core.Tenants(TenantID),
    GoogleSheetID TEXT NOT NULL -- The ID of their Google Sheet
);

-------------------------------------
-- Schema: connections
-- For securely storing credentials
-------------------------------------
-- NOTE: We changed this from the GCP plan.
-- Instead of a path to a secret manager, we will store the
-- *encrypted* token directly, managed by your n8n app.
CREATE TABLE connections.GoogleCredentials (
    CredentialID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    TenantID UUID NOT NULL UNIQUE REFERENCES core.Tenants(TenantID),
    Encrypted_OAuth_Token TEXT NOT NULL -- The encrypted refresh token
);

CREATE TABLE connections.SocialCredentials (
    ConnectionID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    TenantID UUID NOT NULL REFERENCES core.Tenants(TenantID),
    Platform TEXT NOT NULL, -- e.g., "LinkedIn", "X"
    Encrypted_OAuth_Token TEXT NOT NULL
);

-------------------------------------
-- Schema: va
-- For the Virtual Assistant's state
-------------------------------------

-- CONVERSATIONS: Threads for the VA chat
CREATE TABLE va.Conversations (
    ConversationID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    TenantID UUID NOT NULL REFERENCES core.Tenants(TenantID),
    Title TEXT NOT NULL,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MESSAGES: Individual chat bubbles
CREATE TYPE va.sender_role AS ENUM ('User', 'Assistant'); -- Define a custom type

CREATE TABLE va.Messages (
    MessageID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ConversationID UUID NOT NULL REFERENCES va.Conversations(ConversationID) ON DELETE CASCADE,
    SenderRole va.sender_role NOT NULL,
    TextContent TEXT,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    -- FeedbackRating INT
);

-- REQUEST_TASKS: A log of actions the VA performs
CREATE TABLE va.Request_Tasks (
    TaskID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    TenantID UUID NOT NULL REFERENCES core.Tenants(TenantID),
    MessageID UUID REFERENCES va.Messages(MessageID),
    TaskType TEXT NOT NULL, -- e.g., 'CreateProject', 'CreateCalendarEvent'
    Status TEXT NOT NULL DEFAULT 'Pending', -- e.g., Pending, Complete, Failed
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-------------------------------------
-- Schema: knowledge
-- For the VA's RAG capabilities (uses pgvector)
-------------------------------------

-- KNOWLEDGE_BASES: The master files uploaded by users
CREATE TABLE knowledge.Knowledge_Bases (
    KB_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    TenantID UUID NOT NULL REFERENCES core.Tenants(TenantID),
    FileName TEXT NOT NULL,
    GoogleDriveFileID TEXT NOT NULL -- Pointer to the file in *their* GDrive
);

-- TENANT_EMBEDDINGS: The vector store
CREATE TABLE knowledge.Tenant_Embeddings (
    EmbeddingID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    KB_ID UUID NOT NULL REFERENCES knowledge.Knowledge_Bases(KB_ID) ON DELETE CASCADE,
    ContentChunk TEXT NOT NULL,
    -- This is the vector field. Using 768 as a common default for Gemini.
    EmbeddingVector vector(768) NOT NULL 
);

-- After creating the embeddings table, you should create an index
-- for fast searching. This is VITAL for RAG performance.
CREATE INDEX ON knowledge.Tenant_Embeddings
USING HNSW (EmbeddingVector vector_l2_ops);
-- or use IVFFLAT for a different trade-off:
-- CREATE INDEX ON knowledge.Tenant_Embeddings
-- USING IVFFLAT (EmbeddingVector vector_l2_ops) WITH (lists = 100);

-- Grant permissions to your n8n user on these new schemas
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA core TO n8n_service_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA va TO n8n_service_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA knowledge TO n8n_service_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA connections TO n8n_service_user;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA core TO n8n_service_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA va TO n8n_service_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA knowledge TO n8n_service_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA connections TO n8n_service_user;
