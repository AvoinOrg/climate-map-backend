CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE account (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email varchar NOT NULL,
    pw varchar NOT NULL,
    person_name varchar not NULL,
    phone_number varchar not null,
    UNIQUE(email)
);