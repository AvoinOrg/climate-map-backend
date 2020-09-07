CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE account (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email varchar NOT NULL,
    pw varchar NOT NULL,
    UNIQUE(email)
);