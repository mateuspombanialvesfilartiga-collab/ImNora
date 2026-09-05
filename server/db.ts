import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

let db: Database;
const DB_FILE_PATH = path.join(process.cwd(), 'data', 'elo_database.sqlite');

// Helper to ensure directory exists
function ensureDirExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function saveDbToDisk() {
  if (!db) return;
  try {
    ensureDirExists(path.dirname(DB_FILE_PATH));
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error('Error saving database to disk:', err);
  }
}

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();
  ensureDirExists(path.dirname(DB_FILE_PATH));

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      db = new SQL.Database(fileBuffer);
      // Clean up any legacy test/mock properties to ensure only real user properties exist
      try {
        db.run(`
          DELETE FROM property_features WHERE property_id IN ('prop_1', 'prop_2', 'prop_3');
          DELETE FROM property_images WHERE property_id IN ('prop_1', 'prop_2', 'prop_3');
          DELETE FROM seller_applications WHERE property_id IN ('prop_1', 'prop_2', 'prop_3');
          DELETE FROM conversations WHERE property_id IN ('prop_1', 'prop_2', 'prop_3');
          DELETE FROM negotiations WHERE property_id IN ('prop_1', 'prop_2', 'prop_3');
          DELETE FROM property_favorites WHERE property_id IN ('prop_1', 'prop_2', 'prop_3');
          DELETE FROM properties WHERE id IN ('prop_1', 'prop_2', 'prop_3');
        `);
        saveDbToDisk();
      } catch (cleanErr) {
        console.warn('Mock properties cleanup notice:', cleanErr);
      }
      console.log('Loaded SQLite database from disk (purged of mock properties).');
      return db;
    } catch (e) {
      console.warn('Could not read existing database file, initializing fresh in-memory DB:', e);
    }
  }

  db = new SQL.Database();
  initSchema(db);
  await seedInitialData(db);
  saveDbToDisk();
  console.log('Initialized and seeded fresh SQLite database for elo.');
  return db;
}

export function runQuery(sql: string, params: (string | number | null | boolean)[] = []): void {
  db.run(sql, params as any[]);
  saveDbToDisk();
}

export function queryOne<T = any>(sql: string, params: (string | number | null | boolean)[] = []): T | null {
  const stmt = db.prepare(sql);
  stmt.bind(params as any[]);
  if (stmt.step()) {
    const row = stmt.getAsObject() as T;
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export function queryAll<T = any>(sql: string, params: (string | number | null | boolean)[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params as any[]);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

export function executeTransaction<T>(action: () => T): T {
  db.run('BEGIN TRANSACTION;');
  try {
    const result = action();
    db.run('COMMIT;');
    saveDbToDisk();
    return result;
  } catch (error) {
    db.run('ROLLBACK;');
    throw error;
  }
}

function initSchema(database: Database) {
  database.run(`
    PRAGMA foreign_keys = ON;

    -- USERS
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('buyer', 'seller', 'owner', 'admin')),
      is_active INTEGER NOT NULL DEFAULT 1,
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT DEFAULT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- PROFILES
    CREATE TABLE IF NOT EXISTS buyer_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      phone TEXT,
      preferences TEXT
    );

    CREATE TABLE IF NOT EXISTS owner_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      phone TEXT,
      document_number TEXT
    );

    CREATE TABLE IF NOT EXISTS seller_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      phone TEXT,
      creci_number TEXT NOT NULL,
      creci_state TEXT NOT NULL,
      bio TEXT,
      photo_url TEXT,
      verified_status TEXT NOT NULL DEFAULT 'pending' CHECK(verified_status IN ('pending', 'in_review', 'approved', 'rejected', 'suspended')),
      rating_avg REAL NOT NULL DEFAULT 5.0,
      reviews_count INTEGER NOT NULL DEFAULT 0,
      sales_count INTEGER NOT NULL DEFAULT 0
    );

    -- SELLER VERIFICATIONS
    CREATE TABLE IF NOT EXISTS seller_verifications (
      id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      creci_number TEXT NOT NULL,
      creci_state TEXT NOT NULL,
      document_url TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending', 'in_review', 'approved', 'rejected', 'suspended')),
      admin_notes TEXT,
      submitted_at TEXT NOT NULL,
      reviewed_at TEXT,
      reviewed_by TEXT REFERENCES users(id)
    );

    -- ADMIN USERS
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      access_level TEXT NOT NULL DEFAULT 'superadmin',
      created_at TEXT NOT NULL
    );

    -- PROPERTIES
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_seller_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      property_type TEXT NOT NULL,
      price REAL NOT NULL,
      address TEXT NOT NULL,
      neighborhood TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      bedrooms INTEGER NOT NULL DEFAULT 0,
      bathrooms INTEGER NOT NULL DEFAULT 0,
      suites INTEGER NOT NULL DEFAULT 0,
      parking_spots INTEGER NOT NULL DEFAULT 0,
      area_sqm REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'published_open' CHECK(status IN ('draft', 'published_open', 'seller_selected', 'in_negotiation', 'sold', 'paused')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- PROPERTY IMAGES
    CREATE TABLE IF NOT EXISTS property_images (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      is_primary INTEGER NOT NULL DEFAULT 0,
      display_order INTEGER NOT NULL DEFAULT 0
    );

    -- PROPERTY FEATURES
    CREATE TABLE IF NOT EXISTS property_features (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      feature_name TEXT NOT NULL
    );

    -- PROPERTY FAVORITES
    CREATE TABLE IF NOT EXISTS property_favorites (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      UNIQUE(property_id, user_id)
    );

    -- SELLER APPLICATIONS (Candidatura do vendedor - coração do marketplace)
    CREATE TABLE IF NOT EXISTS seller_applications (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      commission_percent REAL NOT NULL,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted', 'under_review', 'accepted', 'rejected', 'withdrawn')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(property_id, seller_id)
    );

    -- CONVERSATIONS
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      participant1_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      participant2_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      conversation_type TEXT NOT NULL CHECK(conversation_type IN ('buyer_seller', 'seller_owner')),
      last_message_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(property_id, participant1_id, participant2_id)
    );

    -- MESSAGES
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      read_at TEXT,
      created_at TEXT NOT NULL
    );

    -- NEGOTIATIONS
    CREATE TABLE IF NOT EXISTS negotiations (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sale_price REAL NOT NULL,
      seller_commission_percent REAL NOT NULL,
      platform_fee_percent REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
      created_at TEXT NOT NULL,
      completed_at TEXT
    );

    -- TRANSACTIONS
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      negotiation_id TEXT NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      final_price REAL NOT NULL,
      seller_commission_value REAL NOT NULL,
      platform_fee_value REAL NOT NULL,
      net_owner_value REAL NOT NULL,
      completed_at TEXT NOT NULL
    );

    -- PLATFORM SETTINGS (Configuráveis dinamicamente - nunca hardcoded)
    CREATE TABLE IF NOT EXISTS platform_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value REAL NOT NULL,
      description TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- REVIEWS (Avaliações do vendedor - única por negociação e pessoa)
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reviewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reviewer_role TEXT NOT NULL CHECK(reviewer_role IN ('buyer', 'owner')),
      negotiation_id TEXT NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
      rating_service REAL NOT NULL,
      rating_communication REAL NOT NULL,
      rating_professionalism REAL NOT NULL,
      rating_overall REAL NOT NULL,
      comment TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(negotiation_id, reviewer_id)
    );

    -- REPORTS (Denúncias)
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reported_item_type TEXT NOT NULL CHECK(reported_item_type IN ('property', 'seller', 'conversation')),
      reported_item_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'resolved', 'dismissed')),
      created_at TEXT NOT NULL
    );

    -- NOTIFICATIONS
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- AUDIT LOGS
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );

    -- REFRESH TOKENS (Hash de token para rotação e invalidação instantânea)
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

async function seedInitialData(database: Database) {
  const now = new Date().toISOString();
  // Hash passwords with bcrypt (rounds: 12)
  const defaultPasswordHash = await bcrypt.hash('Senha@123', 12);
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 12);

  // 1. Platform Settings
  database.run(`
    INSERT INTO platform_settings (setting_key, setting_value, description, updated_at) VALUES
    ('platform_fee_percent', 1.5, 'Taxa percentual da plataforma sobre o valor da venda', '${now}'),
    ('property_listing_fee', 0.0, 'Taxa de publicação de imóvel paga pelo proprietário (R$)', '${now}'),
    ('min_seller_commission_percent', 1.5, 'Comissão mínima permitida que o vendedor pode propor (%)', '${now}'),
    ('max_seller_commission_percent', 10.0, 'Comissão máxima permitida que o vendedor pode propor (%)', '${now}');
  `);

  // 2. Users (Admin, Owners, Sellers, Buyers)
  const users = [
    // Admin
    { id: 'usr_admin', email: 'admin@elo.com.br', pass: adminPasswordHash, role: 'admin' },
    // Owners
    { id: 'usr_owner1', email: 'helena.proprietaria@elo.com.br', pass: defaultPasswordHash, role: 'owner' },
    { id: 'usr_owner2', email: 'marcos.proprietario@elo.com.br', pass: defaultPasswordHash, role: 'owner' },
    // Sellers (Autonomous)
    { id: 'usr_seller1', email: 'carlos.corretor@elo.com.br', pass: defaultPasswordHash, role: 'seller' },
    { id: 'usr_seller2', email: 'mariana.corretora@elo.com.br', pass: defaultPasswordHash, role: 'seller' },
    { id: 'usr_seller3', email: 'rodrigo.pendente@elo.com.br', pass: defaultPasswordHash, role: 'seller' }, // Pending approval
    // Buyers
    { id: 'usr_buyer1', email: 'fernanda.compradora@elo.com.br', pass: defaultPasswordHash, role: 'buyer' },
    { id: 'usr_buyer2', email: 'lucas.comprador@elo.com.br', pass: defaultPasswordHash, role: 'buyer' }
  ];

  for (const u of users) {
    database.run(
      `INSERT INTO users (id, email, password_hash, role, is_active, failed_login_attempts, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, 0, ?, ?);`,
      [u.id, u.email, u.pass, u.role, now, now]
    );
  }

  // Admin Profile
  database.run(
    `INSERT INTO admin_users (id, user_id, access_level, created_at) VALUES ('adm_1', 'usr_admin', 'superadmin', ?);`,
    [now]
  );

  // Buyer Profiles
  database.run(
    `INSERT INTO buyer_profiles (user_id, full_name, phone, preferences) VALUES
     ('usr_buyer1', 'Fernanda Lima Alencar', '(11) 98765-4321', 'Apartamentos de 2 a 3 quartos na Zona Sul'),
     ('usr_buyer2', 'Lucas Gabriel Silva', '(21) 99123-4567', 'Casas com jardim e vaga dupla');`
  );

  // Owner Profiles
  database.run(
    `INSERT INTO owner_profiles (user_id, full_name, phone, document_number) VALUES
     ('usr_owner1', 'Helena Maria de Souza', '(11) 97654-3210', '123.456.789-00'),
     ('usr_owner2', 'Marcos Vinícius Costa', '(21) 98888-7777', '987.654.321-99');`
  );

  // Seller Profiles (Carlos & Mariana are verified with high rep; Rodrigo is pending admin verification)
  database.run(
    `INSERT INTO seller_profiles (user_id, full_name, phone, creci_number, creci_state, bio, photo_url, verified_status, rating_avg, reviews_count, sales_count) VALUES
     ('usr_seller1', 'Carlos Mendes', '(11) 97111-2233', '45210-F', 'SP', 'Especialista em imóveis de alto padrão e negociações ágeis em Pinheiros, Jardins e Vila Mariana. Mais de 12 anos de experiência no mercado autônomo.', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 'approved', 4.9, 14, 18),
     ('usr_seller2', 'Mariana Rocha', '(21) 98222-3344', '38914-F', 'RJ', 'Corretora autônoma focada em experiência transparente, fotografia profissional e conexão humanizada entre proprietários e compradores.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80', 'approved', 5.0, 9, 11),
     ('usr_seller3', 'Rodrigo Lima Santos', '(31) 99333-4455', '67821-F', 'MG', 'Corretor autônomo especializado na Grande BH. Focado em atendimento digital dinâmico.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80', 'pending', 0.0, 0, 0);`
  );

  // Seller Verifications
  database.run(
    `INSERT INTO seller_verifications (id, seller_id, creci_number, creci_state, document_url, status, admin_notes, submitted_at, reviewed_at, reviewed_by) VALUES
     ('ver_1', 'usr_seller1', '45210-F', 'SP', 'https://example.com/creci-carlos.pdf', 'approved', 'CRECI ativo no CRECISP verificado.', '${now}', '${now}', 'usr_admin'),
     ('ver_2', 'usr_seller2', '38914-F', 'RJ', 'https://example.com/creci-mariana.pdf', 'approved', 'CRECI ativo no CRECIRJ verificado.', '${now}', '${now}', 'usr_admin'),
     ('ver_3', 'usr_seller3', '67821-F', 'MG', 'https://example.com/creci-rodrigo.pdf', 'pending', 'Aguardando validação dos documentos na junta CRECI-MG.', '${now}', NULL, NULL);`
  );

  // Initial Audit Log
  database.run(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at) VALUES
    ('aud_1', 'usr_admin', 'SYSTEM_INITIALIZATION', 'platform', 'imnora', 'Sistema Imnora inicializado em modo de produção real com zero imóveis fictícios.', '127.0.0.1', '${now}');
  `);
}
