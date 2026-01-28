import 'dotenv/config';
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// --- DB SETUP ---
const getUltraSanitizedHost = () => {
  let host = (process.env.DB_HOST || '127.0.0.1').trim();
  host = host.replace(/^[^a-zA-Z0-9.]+/, '').replace(/[^a-zA-Z0-9.]+$/, '');
  if (host.toLowerCase() === 'localhost' || host === '') return '127.0.0.1';
  return host;
};

const getDbConfig = () => ({
  user: (process.env.DB_USER).trim(),
  host: getUltraSanitizedHost(),
  database: (process.env.DB_NAME).trim(),
  password: String(process.env.DB_PASSWORD).trim(),
  port: parseInt(process.env.DB_PORT, 10),
});

// Replace Pool creation with a config that disables SSL by default (enable via DB_SSL=true)
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };

const pool = new Pool(poolConfig);

const initDb = async () => {
  let client;
  try {
    try {
      client = await pool.connect();
    } catch (err) {
      if (err.message.includes('SSL') || err.message.includes('protocol')) {
        pool = new Pool({ ...dbConfig, ssl: false });
        client = await pool.connect();
      } else {
        throw err;
      }
    }
    
    await client.query('BEGIN');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await client.query(`
      CREATE TABLE IF NOT EXISTS businesses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        gst_number TEXT,
        logo_url TEXT,
        bank_details TEXT,
        invoice_prefix TEXT,
        quotation_prefix TEXT,
        credit_note_prefix TEXT,
        currency TEXT,
        auto_deduct_inventory BOOLEAN DEFAULT TRUE,
        website TEXT,
        phonepe_merchant_id TEXT,
        phonepe_salt_key TEXT,
        phonepe_salt_index TEXT,
        smtp_host TEXT,
        smtp_port INTEGER,
        smtp_user TEXT,
        smtp_pass TEXT,
        smtp_secure BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_type TEXT DEFAULT 'Business',
      salutation TEXT,
      first_name TEXT,
      last_name TEXT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      mobile TEXT,
      billing_address TEXT,
      billing_street TEXT,
      billing_city TEXT,
      billing_state TEXT,
      billing_zip TEXT,
      billing_country TEXT,
      shipping_address TEXT,
      shipping_street TEXT,
      shipping_city TEXT,
      shipping_state TEXT,
      shipping_zip TEXT,
      shipping_country TEXT,
      gst_number TEXT,
      gst_treatment TEXT,
      pan TEXT,
      place_of_supply TEXT,
      currency TEXT,
      payment_terms TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`);

    const clientCols = [
      { name: 'customer_type', type: 'TEXT', def: "'Business'" },
      { name: 'salutation', type: 'TEXT', def: 'NULL' },
      { name: 'first_name', type: 'TEXT', def: 'NULL' },
      { name: 'last_name', type: 'TEXT', def: 'NULL' },
      { name: 'mobile', type: 'TEXT', def: 'NULL' },
      { name: 'gst_treatment', type: 'TEXT', def: 'NULL' },
      { name: 'pan', type: 'TEXT', def: 'NULL' },
      { name: 'place_of_supply', type: 'TEXT', def: 'NULL' },
      { name: 'payment_terms', type: 'TEXT', def: 'NULL' },
      { name: 'billing_street', type: 'TEXT', def: 'NULL' },
      { name: 'billing_city', type: 'TEXT', def: 'NULL' },
      { name: 'billing_state', type: 'TEXT', def: 'NULL' },
      { name: 'billing_zip', type: 'TEXT', def: 'NULL' },
      { name: 'billing_country', type: 'TEXT', def: 'NULL' },
      { name: 'shipping_street', type: 'TEXT', def: 'NULL' },
      { name: 'shipping_city', type: 'TEXT', def: 'NULL' },
      { name: 'shipping_state', type: 'TEXT', def: 'NULL' },
      { name: 'shipping_zip', type: 'TEXT', def: 'NULL' },
      { name: 'shipping_country', type: 'TEXT', def: 'NULL' }
    ];
    for (const col of clientCols) {
      await client.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='${col.name}') THEN ALTER TABLE clients ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.def}; END IF; END $$;`);
    }

    await client.query(`CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      item_type TEXT DEFAULT 'Goods',
      sku TEXT,
      unit TEXT,
      description TEXT,
      hsn_code TEXT,
      default_rate NUMERIC DEFAULT 0,
      default_tax NUMERIC DEFAULT 0,
      track_inventory BOOLEAN DEFAULT FALSE,
      stock_level NUMERIC DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 5,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`);

    const productCols = [
      { name: 'item_type', type: 'TEXT', def: "'Goods'" },
      { name: 'sku', type: 'TEXT', def: 'NULL' },
      { name: 'unit', type: 'TEXT', def: 'NULL' }
    ];
    for (const col of productCols) {
      await client.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='${col.name}') THEN ALTER TABLE products ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.def}; END IF; END $$;`);
    }

    const docTables = ['invoices', 'quotations', 'credit_notes'];
    for (const tbl of docTables) {
      const numCol = tbl === 'invoices' ? 'invoice_number' : tbl === 'quotations' ? 'quotation_number' : 'credit_note_number';
      await client.query(`CREATE TABLE IF NOT EXISTS ${tbl} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
        type TEXT NOT NULL,
        status TEXT,
        ${numCol} TEXT NOT NULL UNIQUE,
        date DATE NOT NULL,
        due_date DATE,
        currency TEXT NOT NULL,
        notes TEXT,
        terms TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`);

      const itemsTbl = `${tbl.slice(0, -1)}_items`;
      const foreignKey = `${tbl.slice(0, -1)}_id`;
      await client.query(`CREATE TABLE IF NOT EXISTS ${itemsTbl} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ${foreignKey} UUID REFERENCES ${tbl}(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        description TEXT NOT NULL,
        hsn_code TEXT,
        quantity NUMERIC NOT NULL,
        rate NUMERIC NOT NULL,
        tax_percent NUMERIC DEFAULT 0,
        discount_percent NUMERIC DEFAULT 0
      );`);
    }

    await client.query(`CREATE TABLE IF NOT EXISTS inventory_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      quantity NUMERIC NOT NULL,
      date DATE DEFAULT CURRENT_DATE,
      note TEXT
    );`);

    await client.query(`CREATE TABLE IF NOT EXISTS doc_counters (type TEXT PRIMARY KEY, current_val INTEGER DEFAULT 0);`);
    await client.query(`INSERT INTO doc_counters (type, current_val) VALUES ('Invoice', 0), ('Quotation', 0), ('Credit Note', 0) ON CONFLICT DO NOTHING;`);

    await client.query(`CREATE TABLE IF NOT EXISTS expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      amount NUMERIC NOT NULL,
      date DATE NOT NULL,
      category TEXT NOT NULL,
      vendor TEXT,
      mode TEXT,
      reference TEXT,
      receipt_url TEXT,
      note TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`);

    const bCheck = await client.query('SELECT id FROM businesses LIMIT 1');
    if (bCheck.rows.length === 0) {
      await client.query(`INSERT INTO businesses (name, email, phone, address, gst_number, currency, invoice_prefix, quotation_prefix, credit_note_prefix, auto_deduct_inventory) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, ['Syntaxnow Invoicing Business', 'office@Syntaxnow Invoicing.com', '+1 555 0123', '123 Enterprise Blvd', 'GST-PENDING', 'USD', 'INV-', 'QT-', 'CN-', true]);
    }

    await client.query('COMMIT');
    console.log("✅ Database Engine Initialized Fully");
  } catch (e) {
    if (client) await client.query('ROLLBACK');
    console.error("❌ DB Engine Error:", e.message);
  } finally {
    if (client) client.release();
  }
};

initDb();

function toCamel(obj) {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString().split('T')[0];
  if (Array.isArray(obj)) return obj.map(v => toCamel(v));
  if (typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      const camelKey = key.replace(/(_\w)/g, m => m[1].toUpperCase());
      result[camelKey] = toCamel(obj[key]);
    }
    return result;
  }
  return obj;
}

const handleInventorySync = async (client, items, docNumber) => {
  try {
    const bizRes = await client.query('SELECT auto_deduct_inventory FROM businesses ORDER BY created_at ASC LIMIT 1');
    if (!bizRes.rows[0]?.auto_deduct_inventory) return;
    for (const item of items) {
      const pId = item.productId || item.product_id;
      if (!pId) continue;
      const pRes = await client.query('SELECT track_inventory, stock_level FROM products WHERE id = $1', [pId]);
      if (pRes.rows[0]?.track_inventory) {
        const newStock = (Number(pRes.rows[0].stock_level) || 0) - (Number(item.quantity) || 0);
        await client.query('UPDATE products SET stock_level = $1 WHERE id = $2', [newStock, pId]);
        await client.query('INSERT INTO inventory_transactions (product_id, type, quantity, note) VALUES ($1, $2, $3, $4)', [pId, 'OUT', item.quantity, `Auto for ${docNumber}`]);
      }
    }
  } catch (err) { console.error(`📦 Inventory Sync Fail:`, err.message); }
};

app.post('/api/test-smtp', async (req, res) => {
  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure } = req.body;
  const config = { host: smtpHost, port: parseInt(smtpPort, 10), secure: smtpSecure === true, auth: { user: smtpUser, pass: smtpPass }, connectionTimeout: 8000, tls: { rejectUnauthorized: false } };
  const transporter = nodemailer.createTransport(config);
  try {
    await transporter.verify();
    res.json({ success: true, message: 'SMTP Connection Successful' });
  } catch (error) {
    console.error('📧 SMTP Test Failed:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/send-email', async (req, res) => {
  const { to, subject, html, text, attachments } = req.body;
  try {
    const bizRes = await pool.query('SELECT * FROM businesses ORDER BY created_at ASC LIMIT 1');
    const b = bizRes.rows[0];
    if (!b) return res.status(404).json({ error: 'Business profile not found.' });
    const smtpConfig = {
      host: b.smtp_host || process.env.SMTP_HOST,
      port: parseInt(b.smtp_port || process.env.SMTP_PORT, 10),
      secure: b.smtp_secure === true,
      auth: { user: b.smtp_user || process.env.SMTP_USER, pass: b.smtp_pass || process.env.SMTP_PASS },
      connectionTimeout: 15000,
      tls: { rejectUnauthorized: false }
    };
    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) return res.status(400).json({ error: 'SMTP Credentials missing.' });
    const transporter = nodemailer.createTransport(smtpConfig);
    const mailOptions = {
      from: `"${b.name}" <${smtpConfig.auth.user}>`,
      to, subject, text, html,
      attachments: attachments ? attachments.map(att => ({ filename: att.filename, content: att.content, encoding: att.encoding || 'base64', contentType: att.contentType || 'application/pdf' })) : []
    };
    const info = await transporter.sendMail(mailOptions);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('📧 Email delivery failed:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/business', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM businesses ORDER BY created_at ASC LIMIT 1');
    res.json(toCamel(result.rows[0] || {}));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/business', async (req, res) => {
  const d = req.body;
  try {
    const result = await pool.query(`UPDATE businesses SET name=$1, email=$2, phone=$3, address=$4, gst_number=$5, logo_url=$6, bank_details=$7, invoice_prefix=$8, quotation_prefix=$9, credit_note_prefix=$10, currency=$11, auto_deduct_inventory=$12, website=$13, phonepe_merchant_id=$14, phonepe_salt_key=$15, phonepe_salt_index=$16, smtp_host=$17, smtp_port=$18, smtp_user=$19, smtp_pass=$20, smtp_secure=$21 WHERE id = (SELECT id FROM businesses ORDER BY created_at ASC LIMIT 1) RETURNING *`, [d.name, d.email, d.phone, d.address, d.gstNumber, d.logoUrl, d.bankDetails, d.invoicePrefix, d.quotationPrefix, d.creditNotePrefix, d.currency, d.autoDeductInventory, d.website, d.phonepeMerchantId, d.phonepeSaltKey, d.phonepeSaltIndex, d.smtpHost, d.smtpPort, d.smtpUser, d.smtpPass, d.smtpSecure || false]);
    res.json(toCamel(result.rows[0]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const setupDocRoutes = (tbl, numCol, type) => {
  const itemsTbl = `${tbl.slice(0, -1)}_items`;
  const foreignKey = `${tbl.slice(0, -1)}_id`;

  app.get(`/api/${tbl.replace('_', '-')}`, async (req, res) => {
    try {
      const result = await pool.query(`SELECT t.*, COALESCE((SELECT json_agg(items) FROM (SELECT * FROM ${itemsTbl} WHERE ${foreignKey} = t.id) items), '[]'::json) as items FROM ${tbl} t ORDER BY date DESC`);
      const mapped = result.rows.map(r => ({ ...r, invoice_number: r[numCol] }));
      res.json(toCamel(mapped));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post(`/api/${tbl.replace('_', '-')}`, async (req, res) => {
    const d = req.body; const c = await pool.connect();
    try {
      await c.query('BEGIN');
      const resDoc = await c.query(`INSERT INTO ${tbl} (client_id, type, status, ${numCol}, date, due_date, currency, notes, terms) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`, [d.clientId || null, d.type || type, d.status, d.invoiceNumber, d.date, d.dueDate, d.currency, d.notes, d.terms]);
      const docId = resDoc.rows[0].id;
      await c.query('UPDATE doc_counters SET current_val = current_val + 1 WHERE type = $1', [type]);
      for (const it of d.items) {
        await c.query(`INSERT INTO ${itemsTbl} (${foreignKey}, product_id, description, hsn_code, quantity, rate, tax_percent, discount_percent) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [docId, it.productId || null, it.description, it.hsnCode, it.quantity, it.rate, it.taxPercent, it.discountPercent]);
      }
      if (String(d.status).toLowerCase() === 'paid') await handleInventorySync(c, d.items, d.invoiceNumber);
      await c.query('COMMIT'); res.status(201).json({ id: docId });
    } catch (e) { await c.query('ROLLBACK'); res.status(500).json({ error: e.message }); }
    finally { c.release(); }
  });

  app.put(`/api/${tbl.replace('_', '-')}/:id`, async (req, res) => {
    const { id } = req.params; const d = req.body; const c = await pool.connect();
    try {
      await c.query('BEGIN');
      const old = await c.query(`SELECT status FROM ${tbl} WHERE id=$1`, [id]);
      await c.query(`UPDATE ${tbl} SET client_id=$1, status=$2, date=$3, due_date=$4, notes=$5, terms=$6 WHERE id=$7`, [d.clientId || null, d.status, d.date, d.dueDate, d.notes, d.terms, id]);
      await c.query(`DELETE FROM ${itemsTbl} WHERE ${foreignKey}=$1`, [id]);
      for (const it of d.items) {
        await c.query(`INSERT INTO ${itemsTbl} (${foreignKey}, product_id, description, hsn_code, quantity, rate, tax_percent, discount_percent) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [id, it.productId || null, it.description, it.hsnCode, it.quantity, it.rate, it.taxPercent, it.discountPercent]);
      }
      if (String(d.status).toLowerCase() === 'paid' && String(old.rows[0]?.status).toLowerCase() !== 'paid') await handleInventorySync(c, d.items, d.invoiceNumber);
      await c.query('COMMIT'); res.json({ id });
    } catch (e) { await c.query('ROLLBACK'); res.status(500).json({ error: e.message }); }
    finally { c.release(); }
  });
};

setupDocRoutes('invoices', 'invoice_number', 'Invoice');
setupDocRoutes('quotations', 'quotation_number', 'Quotation');
setupDocRoutes('credit_notes', 'credit_note_number', 'Credit Note');

app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients ORDER BY created_at ASC');
    res.json(toCamel(result.rows));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/clients', async (req, res) => {
  const d = req.body;
  try {
    const result = await pool.query(`INSERT INTO clients (
      customer_type, salutation, first_name, last_name, name, email, phone, mobile, 
      billing_address, billing_street, billing_city, billing_state, billing_zip, billing_country,
      shipping_address, shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country,
      gst_number, gst_treatment, pan, place_of_supply, currency, payment_terms
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26) RETURNING *`, 
    [d.customerType, d.salutation, d.firstName, d.lastName, d.name, d.email, d.phone, d.mobile, 
     d.billingAddress, d.billingStreet, d.billingCity, d.billingState, d.billingZip, d.billingCountry,
     d.shippingAddress, d.shippingStreet, d.shippingCity, d.shippingState, d.shippingZip, d.shippingCountry,
     d.gstNumber, d.gstTreatment, d.pan, d.placeOfSupply, d.currency, d.paymentTerms]);
    res.status(201).json(toCamel(result.rows[0]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/clients/:id', async (req, res) => {
  const d = req.body;
  try {
    const result = await pool.query(`UPDATE clients SET 
      customer_type=$1, salutation=$2, first_name=$3, last_name=$4, name=$5, email=$6, phone=$7, mobile=$8, 
      billing_address=$9, billing_street=$10, billing_city=$11, billing_state=$12, billing_zip=$13, billing_country=$14,
      shipping_address=$15, shipping_street=$16, shipping_city=$17, shipping_state=$18, shipping_zip=$19, shipping_country=$20,
      gst_number=$21, gst_treatment=$22, pan=$23, place_of_supply=$24, currency=$25, payment_terms=$26 WHERE id=$27 RETURNING *`, 
    [d.customerType, d.salutation, d.firstName, d.lastName, d.name, d.email, d.phone, d.mobile, 
     d.billingAddress, d.billingStreet, d.billingCity, d.billingState, d.billingZip, d.billingCountry,
     d.shippingAddress, d.shippingStreet, d.shippingCity, d.shippingState, d.shippingZip, d.shippingCountry,
     d.gstNumber, d.gstTreatment, d.pan, d.placeOfSupply, d.currency, d.paymentTerms, req.params.id]);
    res.json(toCamel(result.rows[0]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at ASC');
    res.json(toCamel(result.rows));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/products', async (req, res) => {
  const d = req.body;
  try {
    let r;
    if (d.id) r = await pool.query('UPDATE products SET name=$1, item_type=$2, sku=$3, unit=$4, description=$5, hsn_code=$6, default_rate=$7, default_tax=$8, track_inventory=$9, stock_level=$10, low_stock_threshold=$11 WHERE id=$12 RETURNING *', [d.name, d.itemType, d.sku, d.unit, d.description, d.hsnCode, d.defaultRate, d.defaultTax, d.trackInventory, d.stockLevel, d.lowStockThreshold, d.id]);
    else r = await pool.query('INSERT INTO products (name, item_type, sku, unit, description, hsn_code, default_rate, default_tax, track_inventory, stock_level, low_stock_threshold) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *', [d.name, d.itemType, d.sku, d.unit, d.description, d.hsnCode, d.defaultRate, d.defaultTax, d.trackInventory, d.stockLevel, d.lowStockThreshold]);
    res.json(toCamel(r.rows[0]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/inventory/transactions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory_transactions ORDER BY date DESC, id DESC');
    res.json(toCamel(result.rows));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/inventory/adjust', async (req, res) => {
  const { productId, qty, type, note } = req.body;
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const pRes = await c.query('SELECT stock_level FROM products WHERE id = $1', [productId]);
    const current = Number(pRes.rows[0]?.stock_level) || 0;
    const next = type === 'IN' ? current + Number(qty) : current - Number(qty);
    await c.query('UPDATE products SET stock_level = $1 WHERE id = $2', [next, productId]);
    await c.query('INSERT INTO inventory_transactions (product_id, type, quantity, note) VALUES ($1, $2, $3, $4)', [productId, type, qty, note]);
    await c.query('COMMIT'); res.json({ success: true });
  } catch (e) { await c.query('ROLLBACK'); res.status(500).json({ error: e.message }); }
  finally { c.release(); }
});

app.get('/api/next-number', async (req, res) => {
  try {
    const { type } = req.query;
    const bizRes = await pool.query('SELECT * FROM businesses ORDER BY created_at ASC LIMIT 1');
    const b = bizRes.rows[0];
    const cntRes = await pool.query('SELECT current_val FROM doc_counters WHERE type = $1', [type]);
    const next = (cntRes.rows[0]?.current_val || 0) + 1;
    let pre = b.invoice_prefix || 'INV-';
    if (type === 'Quotation') pre = b.quotation_prefix || 'QT-';
    else if (type === 'Credit Note') pre = b.credit_note_prefix || 'CN-';
    res.json({ nextNumber: `${pre}${next.toString().padStart(4, '0')}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/expenses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    res.json(toCamel(result.rows));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/expenses', async (req, res) => {
  const d = req.body;
  try {
    const r = await pool.query('INSERT INTO expenses (amount, date, category, vendor, mode, reference, receipt_url, note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [d.amount, d.date, d.category, d.vendor, d.mode, d.reference, d.receiptUrl, d.note]);
    res.status(201).json(toCamel(r.rows[0]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const map = { invoices: 'invoices', quotations: 'quotations', 'credit-notes': 'credit_notes', products: 'products', clients: 'clients', expenses: 'expenses' };
  const table = map[type];
  if (!table) return res.status(400).json({ error: 'Invalid type' });
  try { await pool.query(`DELETE FROM ${table} WHERE id=$1`, [id]); res.status(204).send(); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// --- PRODUCTION SERVING ---
// Serve static assets from Vite's built 'dist' directory
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback for SPA: Redirect all non-API requests to index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Wait-for-DB helper: retries a simple query until Postgres becomes reachable
const waitForPostgres = async (pool, { retries = 10, delay = 2000 } = {}) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('✅ Database reachable');
      return;
    } catch (err) {
      const attempt = i + 1;
      console.warn(`DB not ready (attempt ${attempt}/${retries}): ${err.message}`);
      if (attempt === retries) {
        console.error('❌ Could not connect to DB after retries. Exiting.');
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

(async () => {
  try {
    // ensure `pool` is the pg Pool instance defined earlier in this file
    await waitForPostgres(pool, { retries: 12, delay: 3000 });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Production Server active at http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
})();