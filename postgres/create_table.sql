CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE user_account (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email varchar NOT NULL,
    password varchar NOT NULL,
    name varchar,
    phone_number varchar,
    UNIQUE(email),
    type varchar DEFAULT 'explorer'
);

CREATE TABLE user_integrations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_account_id uuid NOT NULL,
    has_vipu boolean DEFAULT FALSE,
    has_metsaan boolean DEFAULT FALSE,
    CONSTRAINT fk_user_account
      FOREIGN KEY(user_account_id) 
	    REFERENCES user_account(id)
);

CREATE UNIQUE INDEX idx_email ON user_account (email);