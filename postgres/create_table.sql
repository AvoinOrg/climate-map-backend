CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE user_account (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email varchar NOT NULL,
    password varchar NOT NULL,
    name varchar,
    phone_number varchar,
    funnel_state INT DEFAULT 1,
    account_type varchar DEFAULT 'explorer',
    email_verified INT default 0,
    UNIQUE(email)
);

CREATE TABLE user_integration (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_account_id uuid NOT NULL,
    integration_type varchar NOT NULL,
    integration_status INT DEFAULT -1,
    integration_data jsonb DEFAULT '{}',
    is_disabled boolean DEFAULT FALSE,
    UNIQUE(user_account_id, integration_type),
    CONSTRAINT fk_user_account
      FOREIGN KEY(user_account_id) 
	    REFERENCES user_account(id)
);


CREATE UNIQUE INDEX idx_email ON user_account (email);